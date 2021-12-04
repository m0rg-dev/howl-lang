package dev.m0rg.howl.ast;

import java.nio.file.Path;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import dev.m0rg.howl.CompilationError;
import dev.m0rg.howl.Compiler;

public class Span {
    public int start;
    public int end;
    public Path source_path;
    public Compiler context;

    public static Span fromJson(Compiler context, Path source_path, JsonElement source) {
        JsonObject obj = source.getAsJsonObject();
        Span rc = new Span();
        rc.context = context;
        rc.start = obj.get("start").getAsInt();
        rc.end = obj.get("end").getAsInt();
        rc.source_path = source_path;
        return rc;
    }

    public void addError(String message) {
        context.addError(new CompilationError(this, message));
    }

    public void addError(String message, String description) {
        context.addError(new CompilationError(this, message, description));
    }
}
