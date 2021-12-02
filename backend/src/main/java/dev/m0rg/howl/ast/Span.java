package dev.m0rg.howl.ast;

import java.nio.file.Path;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

public class Span {
    public int start;
    public int end;
    public Path source_path;

    public static Span fromJson(Path source_path, JsonElement source) {
        JsonObject obj = source.getAsJsonObject();
        Span rc = new Span();
        rc.start = obj.get("start").getAsInt();
        rc.end = obj.get("end").getAsInt();
        rc.source_path = source_path;
        return rc;
    }
}
