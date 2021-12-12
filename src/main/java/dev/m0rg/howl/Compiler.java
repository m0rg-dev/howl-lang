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
import dev.m0rg.howl.cst.CSTImporter;
import dev.m0rg.howl.lint.ExternFunctionBaseTypesOnly;
import dev.m0rg.howl.lint.ExternFunctionNoAliasing;
import dev.m0rg.howl.llvm.LLVMContext;
import dev.m0rg.howl.llvm.LLVMModule;
import dev.m0rg.howl.logger.Logger;
import dev.m0rg.howl.transform.AddClassCasts;
import dev.m0rg.howl.transform.AddGenerics;
import dev.m0rg.howl.transform.AddInterfaceCasts;
import dev.m0rg.howl.transform.AddInterfaceConverters;
import dev.m0rg.howl.transform.AddNumericCasts;
import dev.m0rg.howl.transform.AddSelfToMethods;
import dev.m0rg.howl.transform.CheckTypes;
import dev.m0rg.howl.transform.CoalesceCatch;
import dev.m0rg.howl.transform.CoalesceElse;
import dev.m0rg.howl.transform.ConvertBooleans;
import dev.m0rg.howl.transform.ConvertCustomOverloads;
import dev.m0rg.howl.transform.ConvertIndexLvalue;
import dev.m0rg.howl.transform.ConvertStrings;
import dev.m0rg.howl.transform.ConvertThrow;
import dev.m0rg.howl.transform.ConvertTryCatch;
import dev.m0rg.howl.transform.IndirectMethodCalls;
import dev.m0rg.howl.transform.InferTypes;
import dev.m0rg.howl.transform.MonomorphizeClasses;
import dev.m0rg.howl.transform.RemoveGenericClasses;
import dev.m0rg.howl.transform.ResolveNames;
import dev.m0rg.howl.transform.ResolveOverloads;

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

    public void ingest(Path file, String prefix) throws IOException, InterruptedException {
        Logger.trace("Compiling: " + prefix + " (" + file.toString() + ")");
        ArrayList<String> args = new ArrayList<String>(Arrays.asList(frontend_command));
        args.add(file.toString());
        ProcessBuilder frontend_builder = new ProcessBuilder(args);
        Process frontend = frontend_builder.start();
        int exit = frontend.waitFor();
        if (exit == 0) {
            byte[] raw = frontend.getInputStream().readAllBytes();
            CSTImporter importer = new CSTImporter(this, file);
            ASTElement[] parsed = importer.importProgram(raw);

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
        } else {
            System.err.println("Parse failed with code " + exit);
            System.err.write(frontend.getErrorStream().readAllBytes());
            System.exit(1);
        }
    }

    public void ingestDirectory(Path dir, String prefix) throws IOException, InterruptedException {
        for (File source_file : dir.toFile().listFiles()) {
            if (source_file.isDirectory()) {
                ingestDirectory(source_file.toPath(), prefix + "." + source_file.getName());
            } else {
                ingest(source_file.toPath(), prefix);
            }
        }
    }

    public static void main(String[] args) throws IOException, InterruptedException {
        Options options = new Options();
        Option logTrace = new Option("trace", "Enable TRACE level logging (extremely verbose)");
        options.addOption(logTrace);

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

        System.err.println(cc.root_module.getChild("main").get().format());
        System.exit(0);

        // TODO come up with better API here
        MonomorphizeClasses mc = new MonomorphizeClasses();
        cc.root_module.transform(mc.getFinder());
        mc.generate();
        cc.root_module.transform(mc);

        cc.root_module.transform(new RemoveGenericClasses());

        cc.root_module.transform(new AddInterfaceConverters());
        cc.root_module.transform(new IndirectMethodCalls());
        cc.root_module.transform(new ResolveOverloads());
        cc.root_module.transform(new CheckTypes());
        cc.root_module.transform(new AddNumericCasts());
        cc.root_module.transform(new AddInterfaceCasts());
        cc.root_module.transform(new AddClassCasts());

        cc.root_module.transform(new ExternFunctionBaseTypesOnly());
        cc.root_module.transform(new ExternFunctionNoAliasing());

        if (cmd.hasOption("trace")) {
            System.err.println(cc.root_module.format());
        }

        List<LLVMModule> modules = new ArrayList<>();
        if (cc.successful) {
            LLVMContext context = new LLVMContext();
            modules = cc.root_module.generate(context, true);
        }
        if (cc.successful) {
            for (LLVMModule module : modules) {
                Files.createDirectories(FileSystems.getDefault().getPath("howl_target"));
                Files.writeString(FileSystems.getDefault().getPath("howl_target", module.getName() + ".ll"),
                        module.toString());
            }
        } else {
            for (CompilationError e : cc.errors) {
                if (cc.errors_displayed.contains(e))
                    continue;
                System.err.println(e.format());
                cc.errors_displayed.add(e);
            }
            Logger.error("(compilation aborted due to errors)");
        }
    }
}
