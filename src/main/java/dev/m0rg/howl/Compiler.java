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
import dev.m0rg.howl.ast.Module;
import dev.m0rg.howl.ast.NamedElement;
import dev.m0rg.howl.cst.CSTImporter;
import dev.m0rg.howl.llvm.LLVMContext;
import dev.m0rg.howl.llvm.LLVMModule;
import dev.m0rg.howl.logger.Logger;
import dev.m0rg.howl.logger.Logger.LogLevel;
import dev.m0rg.howl.transform.AddInterfaceCasts;
import dev.m0rg.howl.transform.AddNumericCasts;
import dev.m0rg.howl.transform.AddSelfToMethods;
import dev.m0rg.howl.transform.CheckTypes;
import dev.m0rg.howl.transform.CoalesceElse;
import dev.m0rg.howl.transform.ConvertCustomOverloads;
import dev.m0rg.howl.transform.ConvertIndexLvalue;
import dev.m0rg.howl.transform.ConvertStrings;
import dev.m0rg.howl.transform.IndirectMethodCalls;
import dev.m0rg.howl.transform.MonomorphizeClasses;
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
        ArrayList<String> args = new ArrayList<String>(Arrays.asList(frontend_command));
        args.add(file.toString());
        ProcessBuilder frontend_builder = new ProcessBuilder(args);
        Process frontend = frontend_builder.start();
        int exit = frontend.waitFor();
        if (exit == 0) {
            byte[] raw = frontend.getInputStream().readAllBytes();
            CSTImporter importer = new CSTImporter(this, file);
            ASTElement[] parsed = importer.importProgram(raw);
            for (ASTElement el : parsed) {
                if (el instanceof NamedElement) {
                    NamedElement named = (NamedElement) el;
                    String path = prefix + "." + named.getName();
                    Logger.log(LogLevel.Trace, "Parsed: " + path + " (" + named.getClass().getSimpleName() + ")");
                    this.root_module.insertPath(path, el);
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

        File stdlib = new File("stdlib/");
        for (File lib_file : stdlib.listFiles()) {
            cc.ingest(lib_file.toPath(), "lib");
        }

        cc.ingest(FileSystems.getDefault().getPath(args[0]), "main");

        cc.root_module.transform(new AddSelfToMethods());
        cc.root_module.transform(new ResolveNames());
        cc.root_module.transform(new MonomorphizeClasses());
        cc.root_module.transform(new ConvertStrings());
        cc.root_module.transform(new ConvertIndexLvalue());
        cc.root_module.transform(new ConvertCustomOverloads());
        cc.root_module.transform(new IndirectMethodCalls());
        cc.root_module.transform(new ResolveOverloads());
        cc.root_module.transform(new CheckTypes());
        cc.root_module.transform(new CoalesceElse());
        cc.root_module.transform(new AddNumericCasts());
        cc.root_module.transform(new AddInterfaceCasts());

        if (cc.successful) {
            LLVMContext context = new LLVMContext();
            List<LLVMModule> modules = cc.root_module.generate(context, true);
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
