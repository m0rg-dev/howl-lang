package dev.m0rg.howl;

import java.io.File;
import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;

import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.CommandLineParser;
import org.apache.commons.cli.DefaultParser;
import org.apache.commons.cli.HelpFormatter;
import org.apache.commons.cli.Option;
import org.apache.commons.cli.Options;
import org.apache.commons.cli.ParseException;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Finder;
import dev.m0rg.howl.ast.ImportStatement;
import dev.m0rg.howl.ast.ModStatement;
import dev.m0rg.howl.ast.Module;
import dev.m0rg.howl.ast.NamedElement;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AStructureReference;
import dev.m0rg.howl.ast.type.algebraic.AlgebraicType;
import dev.m0rg.howl.cst.CSTImporter;
import dev.m0rg.howl.lint.CheckExceptions;
import dev.m0rg.howl.lint.CheckInterfaceImplementations;
import dev.m0rg.howl.lint.ExternFunctionBaseTypesOnly;
import dev.m0rg.howl.lint.StaticNonStatic;
import dev.m0rg.howl.lint.SuperConstructorCalls;
import dev.m0rg.howl.llvm.LLVMContext;
import dev.m0rg.howl.llvm.LLVMModule;
import dev.m0rg.howl.logger.Logger;
import dev.m0rg.howl.transform.AddClassCasts;
import dev.m0rg.howl.transform.AddGenerics;
import dev.m0rg.howl.transform.AddInterfaceCasts;
import dev.m0rg.howl.transform.AddInterfaceConverters;
import dev.m0rg.howl.transform.AddNumericCasts;
import dev.m0rg.howl.transform.AddSelfToMethods;
import dev.m0rg.howl.transform.Coalesce;
import dev.m0rg.howl.transform.MultiPass;
import dev.m0rg.howl.transform.ConvertBooleans;
import dev.m0rg.howl.transform.ConvertCustomOverloads;
import dev.m0rg.howl.transform.ConvertFor;
import dev.m0rg.howl.transform.ConvertIndexLvalue;
import dev.m0rg.howl.transform.ConvertStrings;
import dev.m0rg.howl.transform.ConvertSuper;
import dev.m0rg.howl.transform.ConvertThrow;
import dev.m0rg.howl.transform.ConvertTryCatch;
import dev.m0rg.howl.transform.EnsureTypesResolve;
import dev.m0rg.howl.transform.InferTypes;
import dev.m0rg.howl.transform.Monomorphize2;
import dev.m0rg.howl.transform.ResolveNames;
import dev.m0rg.howl.transform.RunStaticAnalysis;

public class Compiler {
    public static CommandLine cmd;

    Module root_module;
    List<CompilationError> errors;
    Set<CompilationError> errors_displayed;
    boolean successful = true;

    Compiler() {
        this.root_module = new Module("root");
        this.errors = new LinkedList<>();
        this.errors_displayed = new HashSet<>();
    }

    public void addError(CompilationError e) {
        errors.add(e);
        successful = false;
    }

    public ASTElement[] parse(Path file, String prefix) throws IOException, InterruptedException {
        String[] frontend_command = new String[1];

        try {
            frontend_command[0] = new File(Compiler.class.getProtectionDomain().getCodeSource().getLocation()
                    .toURI()).getParent() + "/howl-rs";
        } catch (URISyntaxException e) {
            ;
        }

        ArrayList<String> args = new ArrayList<String>(Arrays.asList(frontend_command));
        args.add(file.toString());
        ProcessBuilder frontend_builder = new ProcessBuilder(args);
        Process frontend = frontend_builder.start();
        int exit = frontend.waitFor();
        if (exit == 0) {
            byte[] raw = frontend.getInputStream().readAllBytes();
            frontend.getInputStream().close();
            CSTImporter importer = new CSTImporter(this, file);
            return importer.importProgram(raw);
        } else {
            System.err.println("Parse failed with code " + exit);
            System.err.write(frontend.getErrorStream().readAllBytes());
            System.exit(1);
            return new ASTElement[0];
        }
    }

    public synchronized void load(Path file, ASTElement[] parsed, String prefix)
            throws IOException, InterruptedException {
        String[] prefix_parts = prefix.split("\\.");
        Module this_module = new Module(prefix_parts[prefix_parts.length - 1]);
        if (root_module.resolveName(prefix).isEmpty()) {
            this.root_module.insertPath(prefix, this_module);
        }

        for (ASTElement el : parsed) {
            if (el instanceof NamedElement) {
                NamedElement named = (NamedElement) el;
                String path = prefix + "." + named.getName();
                this.root_module.insertPath(path, el);
            } else if (el instanceof ImportStatement) {
                String imported_path = ((ImportStatement) el).getPath();
                Module m = (Module) root_module.resolveName(prefix).get();
                m.insertItem(el);
                if (!m.resolveName(imported_path).isPresent()) {
                    Path source_path = file.getParent().resolve(imported_path.replace(".", "/"));
                    if (source_path.toFile().isDirectory()) {
                        ingestDirectory(source_path, prefix + "." + imported_path);
                    } else {
                        el.getSpan().addError("no such module (" + source_path.toString() + ")");
                    }
                }
            } else if (el instanceof ModStatement) {
                String imported_path = ((ModStatement) el).getPath();
                Module m = (Module) root_module.resolveName(prefix).get();
                if (!m.resolveName(imported_path).isPresent()) {
                    Path source_path = file.getParent().resolve(imported_path.replace(".", "/"));
                    if (source_path.toFile().isDirectory()) {
                        ingestDirectory(source_path, prefix + "." + imported_path);
                    } else {
                        el.getSpan().addError("no such module (" + source_path.toString() + ")");
                    }
                }
            } else {
                throw new IllegalArgumentException();
            }
        }
    }

    public void ingest(Path file, String prefix) throws IOException, InterruptedException {
        ASTElement[] parsed = parse(file, prefix);
        load(file, parsed, prefix);
    }

    public void ingestDirectory(Path dir, String prefix) throws IOException, InterruptedException {
        List<File> subfiles = new ArrayList<>();

        for (File source_file : dir.toFile().listFiles()) {
            if (source_file.isDirectory()) {
                subfiles.add(source_file);
            } else {
                if (source_file.getName().endsWith(".hl")) {
                    subfiles.add(source_file);
                }
            }
        }

        subfiles.parallelStream().forEach(f -> {
            try {
                if (f.isDirectory()) {
                    ingestDirectory(f.toPath(), prefix + "." + f.getName());
                } else {
                    ingest(f.toPath(), prefix);
                }
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });
    }

    public static void main(String[] args) throws IOException, InterruptedException {
        Options options = new Options();
        Option logTrace = Option.builder(null).longOpt("trace")
                .desc("Enable TRACE level logging (extremely verbose)").build();
        Option output = Option.builder("o").longOpt("output").desc("Write output to FILE").hasArg().argName("FILE")
                .required().build();

        options.addOption(logTrace);
        options.addOption(output);

        CommandLineParser opt_parser = new DefaultParser();
        HelpFormatter formatter = new HelpFormatter();

        try {
            cmd = opt_parser.parse(options, args);
        } catch (ParseException e) {
            System.out.println(e.getMessage());
            formatter.printHelp("howlc", options);

            System.exit(1);
        }

        Compiler cc = new Compiler();

        Path stdlib_path;
        if (System.getenv().containsKey("HOWL_STDLIB")) {
            stdlib_path = FileSystems.getDefault().getPath(System.getenv().get("HOWL_STDLIB")).toAbsolutePath();
        } else {
            stdlib_path = FileSystems.getDefault().getPath("stdlib/").toAbsolutePath();
        }

        long parse_start = System.currentTimeMillis();

        // cc.ingestDirectory(stdlib_path, "lib");
        cc.ingest(FileSystems.getDefault().getPath(args[0]).toAbsolutePath(), "main");

        Logger.trace("parse complete at " + (System.currentTimeMillis() - parse_start) + " ms");

        long transform_start = System.currentTimeMillis();
        cc.root_module.transform(new Coalesce());
        Logger.trace("  => Coalesce " + (System.currentTimeMillis() - transform_start) + " ms");
        transform_start = System.currentTimeMillis();

        Finder.find(cc.root_module, x -> RunStaticAnalysis.apply(x));
        Logger.trace("  => RunStaticAnalysis " + (System.currentTimeMillis() - transform_start) + " ms");
        transform_start = System.currentTimeMillis();

        // System.err.println(cc.root_module.getChild("main").get().format());
        // System.exit(0);

        cc.root_module.transform(new MultiPass(new ASTTransformer[] {
                new ConvertTryCatch(),
                new ConvertFor(),
                new ConvertBooleans(),
                new ConvertSuper(),
                new SuperConstructorCalls(),
                new AddSelfToMethods(),
        }));
        Logger.trace("  => Combined1 " + (System.currentTimeMillis() -
                transform_start) + " ms");
        transform_start = System.currentTimeMillis();

        cc.root_module.transform(new ConvertThrow());
        Logger.trace("  => ConvertThrow " + (System.currentTimeMillis() - transform_start) + " ms");
        transform_start = System.currentTimeMillis();

        cc.root_module.transform(new MultiPass(new ASTTransformer[] {
                new ResolveNames(),
                new ConvertStrings(),
                new ConvertIndexLvalue(),
                // new AddGenerics(),
        }));
        Logger.trace("  => Combined2 " + (System.currentTimeMillis() - transform_start) + " ms");
        transform_start = System.currentTimeMillis();

        cc.root_module.transform(new ConvertCustomOverloads());
        Logger.trace("  => ConvertCustomOverloads " + (System.currentTimeMillis() -
                transform_start) + " ms");
        transform_start = System.currentTimeMillis();

        // cc.root_module.transform(new InferTypes());
        // Logger.trace(" => InferTypes " + (System.currentTimeMillis() -
        // transform_start) + " ms");
        // transform_start = System.currentTimeMillis();

        Finder.find(cc.root_module, x -> CheckInterfaceImplementations.apply(x));
        Logger.trace("  => CheckInterfaceImplementations " + (System.currentTimeMillis() - transform_start) + " ms");
        transform_start = System.currentTimeMillis();

        cc.root_module.transform(new MultiPass(new ASTTransformer[] {
                // new StaticNonStatic(),
                new CheckExceptions(),
        }));
        Logger.trace("  => Combined3 " + (System.currentTimeMillis() - transform_start) + " ms");
        transform_start = System.currentTimeMillis();

        // Monomorphize2 mc2 = new Monomorphize2();
        // cc.root_module.transform(mc2);
        // Logger.trace(" => Monomorphize " + (System.currentTimeMillis() -
        // transform_start) + " ms");
        // for (AStructureReference r : mc2.getToGenerate()) {
        // r.getSource().getSource().monomorphize(r);
        // }
        // Logger.trace(" => Monomorphize " + (System.currentTimeMillis() -
        // transform_start) + " ms");
        // transform_start = System.currentTimeMillis();

        cc.root_module.transform(new MultiPass(new ASTTransformer[] {
                new EnsureTypesResolve(),
                // This needs to happen after monomorphization because
                // AddInterfaceConverters creates newtype references that will break
                // when monomorphization happens.
                new AddInterfaceConverters(),
        }));
        Logger.trace("  => Combined4 " + (System.currentTimeMillis() - transform_start) + " ms");
        transform_start = System.currentTimeMillis();

        cc.root_module.transform(new MultiPass(new ASTTransformer[] {
                new AddInterfaceCasts(),
                new AddNumericCasts(),
                new AddClassCasts(),
                new ExternFunctionBaseTypesOnly(),
        }));
        Logger.trace("  => Combined5 " + (System.currentTimeMillis() - transform_start) + " ms");

        if (cmd.hasOption("trace")) {
            System.err.println(cc.root_module.format());
        }

        Logger.trace("transform complete at " + (System.currentTimeMillis() - parse_start) + " ms");

        Logger.trace("Logger.log() invocations: " + Logger.count);
        Logger.trace("ASTElement.getPath() invocations: " + ASTElement.pathcount);
        Logger.trace("ASTElement.getPath() inner runtime = " + ASTElement.pathtime + " ms");
        Logger.trace("ASTElement.resolveName() invocations: " + ASTElement.rescount);
        Logger.trace("ASTElement.resolveName() inner runtime = " + ASTElement.restime + " ms");
        Logger.trace("ASTElement.setParent() invocations: " + ASTElement.setparentcount);
        Logger.trace("ALambdaTerm.evaluate() invocations: " + ALambdaTerm.evalcount);
        Logger.trace("ALambdaTerm.evaluate() unique expressions: " + ALambdaTerm.evalcache.size());
        Logger.trace("ALambdaTerm.evaluate() naïve cache results: " + ALambdaTerm.evalhit + " hits, "
                + ALambdaTerm.evalmiss + " misses, " + ALambdaTerm.evalbust + " busts");
        Logger.trace("ALambdaTerm.evaluate() inner runtime = " + ALambdaTerm.evaltime + " ms");

        List<LLVMModule> modules = new ArrayList<>();
        if (cc.successful) {
            LLVMContext context = new LLVMContext();
            modules = cc.root_module.generate(context, true);
        }

        Logger.trace("generate complete at " + (System.currentTimeMillis() - parse_start) + " ms");

        if (cc.successful) {
            Path tmpdir = Files.createTempDirectory("howl." + ProcessHandle.current().pid());
            List<String> ld_args = new ArrayList<>();
            List<Process> cc_procs = new ArrayList<>();
            ld_args.add("cc");
            ld_args.add("-o");
            ld_args.add(cmd.getOptionValue("output"));
            ld_args.add(stdlib_path.resolve("hrt0.c").toAbsolutePath().toString());
            for (LLVMModule module : modules) {
                System.err.println(module);
                Files.writeString(tmpdir.resolve(module.getName() + ".ll"),
                        module.toString());

                ProcessBuilder cc_builder = new ProcessBuilder(
                        Arrays.asList(
                                new String[] { "clang", "-c", "-o",
                                        tmpdir.resolve(module.getName() + ".o").toString(),
                                        tmpdir.resolve(module.getName() + ".ll").toString(), "-Wno-override-module",
                                        "-O0" })).inheritIO();
                Process cc_process = cc_builder.start();
                cc_procs.add(cc_process);
                ld_args.add(tmpdir.resolve(module.getName() + ".o").toString());
            }

            for (Process cc_process : cc_procs) {
                if (cc_process.waitFor() != 0) {
                    Logger.error("(compilation aborted)");
                    System.exit(1);
                }
            }

            Logger.trace("assemble complete at " + (System.currentTimeMillis() - parse_start) + " ms");

            ProcessBuilder ld_builder = new ProcessBuilder(ld_args).inheritIO();
            Process ld_process = ld_builder.start();
            if (ld_process.waitFor() != 0) {
                Logger.error("(compilation aborted)");
                System.exit(1);
            }

            Logger.trace("link complete at " + (System.currentTimeMillis() - parse_start) + " ms");

        } else {
            for (CompilationError e : cc.errors) {
                if (cc.errors_displayed.contains(e))
                    continue;
                System.err.println(e.format());
                cc.errors_displayed.add(e);
            }
            Logger.error("(compilation aborted due to errors)");
            System.exit(1);
        }
    }
}
