package dev.m0rg.howl;

import java.io.File;
import java.io.IOException;
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
import dev.m0rg.howl.ast.ImportStatement;
import dev.m0rg.howl.ast.ModStatement;
import dev.m0rg.howl.ast.Module;
import dev.m0rg.howl.ast.NamedElement;
import dev.m0rg.howl.ast.type.algebraic.AStructureReference;
import dev.m0rg.howl.cst.CSTImporter;
import dev.m0rg.howl.lint.CheckExceptions;
import dev.m0rg.howl.lint.ExternFunctionBaseTypesOnly;
import dev.m0rg.howl.llvm.LLVMContext;
import dev.m0rg.howl.llvm.LLVMModule;
import dev.m0rg.howl.logger.Logger;
import dev.m0rg.howl.transform.AddClassCasts;
import dev.m0rg.howl.transform.AddGenerics;
import dev.m0rg.howl.transform.AddInterfaceCasts;
import dev.m0rg.howl.transform.AddInterfaceConverters;
import dev.m0rg.howl.transform.AddNumericCasts;
import dev.m0rg.howl.transform.AddSelfToMethods;
import dev.m0rg.howl.transform.CoalesceCatch;
import dev.m0rg.howl.transform.CoalesceElse;
import dev.m0rg.howl.transform.ConvertBooleans;
import dev.m0rg.howl.transform.ConvertCustomOverloads;
import dev.m0rg.howl.transform.ConvertIndexLvalue;
import dev.m0rg.howl.transform.ConvertStrings;
import dev.m0rg.howl.transform.ConvertThrow;
import dev.m0rg.howl.transform.ConvertTryCatch;
import dev.m0rg.howl.transform.InferTypes;
import dev.m0rg.howl.transform.Monomorphize2;
import dev.m0rg.howl.transform.ResolveNames;

public class Compiler {
    final String[] frontend_command = { "./howl-rs/target/debug/howl-rs" };
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
        Logger.trace("Compiling: " + prefix + " (" + file.toString() + ")");

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

        Path stdlib_path = FileSystems.getDefault().getPath("stdlib/").toAbsolutePath();

        // cc.ingestDirectory(stdlib_path, "lib");
        cc.ingest(FileSystems.getDefault().getPath(args[0]).toAbsolutePath(), "main");

        cc.root_module.transform(new CoalesceElse());
        cc.root_module.transform(new CoalesceCatch());
        cc.root_module.transform(new ConvertTryCatch());
        cc.root_module.transform(new ConvertThrow());
        cc.root_module.transform(new ConvertBooleans());
        cc.root_module.transform(new AddSelfToMethods());
        cc.root_module.transform(new ResolveNames());
        cc.root_module.transform(new ConvertStrings());
        cc.root_module.transform(new ConvertIndexLvalue());
        cc.root_module.transform(new ConvertCustomOverloads());

        cc.root_module.transform(new AddGenerics());
        cc.root_module.transform(new InferTypes());

        cc.root_module.transform(new AddNumericCasts());

        // needs to come before AddClassCasts - easier to find what type the
        // to-be-thrown exception is
        cc.root_module.transform(new CheckExceptions());

        Monomorphize2 mc2 = new Monomorphize2();
        cc.root_module.transform(mc2);
        for (AStructureReference r : mc2.getToGenerate()) {
            Logger.trace("generate: " + r.format() + " " + r.mangle());
            r.getSource().getSource().monomorphize(r);
        }

        // This needs to happen after monomorphization because
        // AddInterfaceConverters creates newtype references that will break
        // when monomorphization happens.
        cc.root_module.transform(new AddInterfaceConverters());
        cc.root_module.transform(new AddInterfaceCasts());
        cc.root_module.transform(new AddClassCasts());

        cc.root_module.transform(new ExternFunctionBaseTypesOnly());

        // cc.root_module.transform(new IndirectMethodCalls());

        // System.err.println(cc.root_module.getChild("main").get().format());
        // System.exit(0);

        if (cmd.hasOption("trace")) {
            System.err.println(cc.root_module.format());
        }

        List<LLVMModule> modules = new ArrayList<>();
        if (cc.successful) {
            LLVMContext context = new LLVMContext();
            modules = cc.root_module.generate(context, true);
        }
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
                                        "-O2" })).inheritIO();
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

            ProcessBuilder ld_builder = new ProcessBuilder(ld_args).inheritIO();
            Process ld_process = ld_builder.start();
            if (ld_process.waitFor() != 0) {
                Logger.error("(compilation aborted)");
                System.exit(1);
            }
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
