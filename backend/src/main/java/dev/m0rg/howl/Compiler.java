package dev.m0rg.howl;

import java.io.File;
import java.io.IOException;
import java.nio.file.FileSystems;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Module;
import dev.m0rg.howl.ast.NamedElement;
import dev.m0rg.howl.cst.CSTImporter;
import dev.m0rg.howl.logger.Logger;
import dev.m0rg.howl.logger.Logger.LogLevel;
import dev.m0rg.howl.transform.TestTransformer;

public class Compiler {
    final String[] frontend_command = { "../howl-rs/target/debug/howl-rs", "--root-module", "h" };

    Module root_module;

    Compiler() {
        this.root_module = new Module("root");
    }

    public void ingest(Path file, String prefix) throws IOException, InterruptedException {
        ArrayList<String> args = new ArrayList<String>(Arrays.asList(frontend_command));
        args.add(file.toString());
        ProcessBuilder frontend_builder = new ProcessBuilder(args);
        Process frontend = frontend_builder.start();
        int exit = frontend.waitFor();
        if (exit == 0) {
            byte[] raw = frontend.getInputStream().readAllBytes();
            CSTImporter importer = new CSTImporter(file);
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
            System.exit(1);
        }
    }

    public static void main(String[] args) throws IOException, InterruptedException {
        Compiler cc = new Compiler();

        File stdlib = new File("stdlib/");
        for (File lib_file : stdlib.listFiles()) {
            cc.ingest(lib_file.toPath(), "lib");
        }

        cc.ingest(FileSystems.getDefault().getPath(args[0]), "main");

        System.err.println(cc.root_module.format());

        cc.root_module.transform(new TestTransformer());
    }
}
