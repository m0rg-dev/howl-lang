package dev.m0rg.howl;

import java.io.IOException;
import java.nio.file.FileSystems;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.cst.CSTImporter;

public class Compiler {
    final String[] frontend_command = { "../howl-rs/target/debug/howl-rs", "--root-module", "h" };

    public void ingest(Path file) throws IOException, InterruptedException {
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
                System.out.println(el.format());
            }
        } else {
            System.err.println("Parse failed with code " + exit);
            System.exit(1);
        }
    }

    public static void main(String[] args) throws IOException, InterruptedException {
        Compiler cc = new Compiler();
        cc.ingest(FileSystems.getDefault().getPath(args[0]));
    }
}
