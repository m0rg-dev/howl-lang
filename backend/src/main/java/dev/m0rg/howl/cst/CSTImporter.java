package dev.m0rg.howl.cst;

import java.io.IOException;
import java.nio.file.Path;
import java.util.LinkedList;
import java.util.Set;
import java.util.Map.Entry;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import com.google.gson.JsonParser;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Class;
import dev.m0rg.howl.ast.Identifier;
import dev.m0rg.howl.ast.NamedType;
import dev.m0rg.howl.ast.Placeholder;
import dev.m0rg.howl.ast.RawPointerType;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.TypeElement;
import dev.m0rg.howl.logger.Logger;
import dev.m0rg.howl.logger.Logger.LogLevel;

public class CSTImporter {
    Path source_path;

    public CSTImporter(Path source_path) {
        this.source_path = source_path;
    }

    public ASTElement[] importProgram(byte[] source) throws JsonParseException, IOException {
        return parseElements(JsonParser.parseString(new String(source)).getAsJsonArray());
    }

    ASTElement[] parseElements(JsonElement source) {
        JsonArray elements = source.getAsJsonArray();
        Stream<JsonElement> element_stream = StreamSupport.stream(elements.spliterator(), false);
        return element_stream
                .map(x -> this.parseElement(x))
                .collect(Collectors.toCollection(LinkedList<ASTElement>::new)).toArray(ASTElement[]::new);
    }

    public ASTElement parseElement(JsonElement source) {
        JsonObject obj = source.getAsJsonObject();
        Set<Entry<String, JsonElement>> entries = obj.entrySet();
        Entry<String, JsonElement> first = entries.iterator().next();
        JsonObject inner_obj = first.getValue().getAsJsonObject();
        Logger.log(LogLevel.Trace, "import: " + first.getKey());
        switch (first.getKey()) {
            case "BaseType":
                return this.parseBaseType(inner_obj);
            case "Class":
                return this.parseClass(inner_obj);
            case "ClassField":
                return this.parseClassField(inner_obj);
            case "RawPointerType":
                return this.parseRawPointerType(inner_obj);
            default:
                JsonElement span = inner_obj.get("span");
                return new Placeholder(Span.fromJson(source_path, span));
        }
    }

    JsonObject chain(JsonObject source, String... path) {
        for (String step : path) {
            source = source.get(step).getAsJsonObject();
        }
        return source;
    }

    NamedType parseBaseType(JsonObject source) {
        return new NamedType(extractSpan(source), source.get("name").getAsString());
    }

    Class parseClass(JsonObject source) {
        ClassHeader header = parseClassHeader(chain(source, "header", "ClassHeader"));
        ASTElement[] body = parseElements(
                chain(source, "body", "ClassBody").get("elements").getAsJsonArray());
        Class rc = new Class(extractSpan(source), header.name);

        for (ASTElement el : body) {
            if (el instanceof ClassField) {
                ClassField<?> field = (ClassField<?>) el;
                rc.setField(field.name, field.type);
            }
        }

        return rc;
    }

    ClassField<TypeElement> parseClassField(JsonObject source) {
        Identifier name = parseIdentifier(chain(source, "fieldname", "Identifier"));
        ASTElement type = parseElement(source.get("fieldtype"));
        if (type instanceof TypeElement) {
            return new ClassField<TypeElement>(extractSpan(source), name.getName(),
                    (TypeElement) type);
        } else {
            throw new IllegalArgumentException();
        }
    }

    ClassHeader parseClassHeader(JsonObject source) {
        Identifier name = parseIdentifier(chain(source, "name", "Identifier"));
        return new ClassHeader(extractSpan(source), name.getName());
    }

    Identifier parseIdentifier(JsonObject source) {
        return new Identifier(extractSpan(source), source.get("name").getAsString());
    }

    RawPointerType<TypeElement> parseRawPointerType(JsonObject source) {
        ASTElement inner = parseElement(source.get("inner"));
        if (inner instanceof TypeElement) {
            return new RawPointerType<TypeElement>(extractSpan(source)).setInner((TypeElement) inner);
        } else {
            throw new IllegalArgumentException();
        }
    }

    Span extractSpan(JsonObject source) {
        return Span.fromJson(source_path, source.get("span"));
    }

    // CST-only elements below this line
    static class ClassHeader extends ASTElement {
        String name;

        public ClassHeader(Span span, String name) {
            super(span);
            this.name = name;
        }

        public String format() {
            throw new UnsupportedOperationException();
        }
    }

    static class ClassField<T extends TypeElement> extends ASTElement {
        String name;
        T type;

        public ClassField(Span span, String name, T type) {
            super(span);
            this.name = name;
            this.type = type;
        }

        public String format() {
            throw new UnsupportedOperationException();
        }
    }
}
