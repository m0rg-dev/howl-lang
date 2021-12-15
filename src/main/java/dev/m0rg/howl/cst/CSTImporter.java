package dev.m0rg.howl.cst;

import java.io.IOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import com.google.gson.JsonParser;

import dev.m0rg.howl.Compiler;
import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Argument;
import dev.m0rg.howl.ast.Class;
import dev.m0rg.howl.ast.Field;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.Identifier;
import dev.m0rg.howl.ast.ImportStatement;
import dev.m0rg.howl.ast.Interface;
import dev.m0rg.howl.ast.ModStatement;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.expression.ArithmeticExpression;
import dev.m0rg.howl.ast.expression.BooleanInversionExpression;
import dev.m0rg.howl.ast.expression.ConstructorCallExpression;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.expression.FieldReferenceExpression;
import dev.m0rg.howl.ast.expression.FunctionCallExpression;
import dev.m0rg.howl.ast.expression.IndexExpression;
import dev.m0rg.howl.ast.expression.MacroCallExpression;
import dev.m0rg.howl.ast.expression.NameExpression;
import dev.m0rg.howl.ast.expression.NumberExpression;
import dev.m0rg.howl.ast.expression.SpecifiedTypeExpression;
import dev.m0rg.howl.ast.expression.StringLiteral;
import dev.m0rg.howl.ast.statement.AssignmentStatement;
import dev.m0rg.howl.ast.statement.CatchStatement;
import dev.m0rg.howl.ast.statement.CompoundStatement;
import dev.m0rg.howl.ast.statement.ElseIfStatement;
import dev.m0rg.howl.ast.statement.ElseStatement;
import dev.m0rg.howl.ast.statement.IfStatement;
import dev.m0rg.howl.ast.statement.LocalDefinitionStatement;
import dev.m0rg.howl.ast.statement.ReturnStatement;
import dev.m0rg.howl.ast.statement.SimpleStatement;
import dev.m0rg.howl.ast.statement.Statement;
import dev.m0rg.howl.ast.statement.ThrowStatement;
import dev.m0rg.howl.ast.statement.TryStatement;
import dev.m0rg.howl.ast.statement.WhileStatement;
import dev.m0rg.howl.ast.type.FunctionType;
import dev.m0rg.howl.ast.type.LambdaType;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.RawPointerType;
import dev.m0rg.howl.ast.type.SpecifiedType;
import dev.m0rg.howl.ast.type.TypeConstraint;
import dev.m0rg.howl.ast.type.TypeElement;

public class CSTImporter {
    Path source_path;
    Compiler context;

    public CSTImporter(Compiler context, Path source_path) {
        this.source_path = source_path;
        this.context = context;
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
        switch (first.getKey()) {
            case "ArithmeticExpression":
                return this.parseArithmeticExpression(inner_obj);
            case "AssignmentStatement":
                return this.parseAssignmentStatement(inner_obj);
            case "BaseType":
                return this.parseBaseType(inner_obj);
            case "BooleanInversionExpression":
                return this.parseBooleanInversionExpression(inner_obj);
            case "CatchStatement":
                return this.parseCatchStatement(inner_obj);
            case "Class":
                return this.parseClass(inner_obj);
            case "ClassField":
                return this.parseClassField(inner_obj);
            case "CompoundStatement":
                return this.parseCompoundStatement(inner_obj);
            case "ConstructorCallExpression":
                return this.parseConstructorCallExpression(inner_obj);
            case "ElseIfStatement":
                return this.parseElseIfStatement(inner_obj);
            case "ElseStatement":
                return this.parseElseStatement(inner_obj);
            case "FieldReferenceExpression":
                return this.parseFieldReferenceExpression(inner_obj);
            case "FunctionCallExpression":
                return this.parseFunctionCallExpression(inner_obj);
            case "FunctionDeclaration":
                return this.parseFunctionDeclaration(inner_obj);
            case "Function":
                return this.parseFunction(inner_obj);
            case "FunctionType":
                return this.parseFunctionType(inner_obj);
            case "Identifier":
                return this.parseIdentifier(inner_obj);
            case "IfStatement":
                return this.parseIfStatement(inner_obj);
            case "IndexExpression":
                return this.parseIndexExpression(inner_obj);
            case "ImportStatement":
                return this.parseImportStatement(inner_obj);
            case "Interface":
                return this.parseInterface(inner_obj);
            case "LocalDefinitionStatement":
                return this.parseLocalDefinitionStatement(inner_obj);
            case "MacroCallExpression":
                return this.parseMacroCallExpression(inner_obj);
            case "ModStatement":
                return this.parseModStatement(inner_obj);
            case "NameExpression":
                return this.parseNameExpression(inner_obj);
            case "NumberExpression":
                return this.parseNumberExpression(inner_obj);
            case "RawPointerType":
                return this.parseRawPointerType(inner_obj);
            case "ReturnStatement":
                return this.parseReturnStatement(inner_obj);
            case "SimpleStatement":
                return this.parseSimpleStatement(inner_obj);
            case "SpecifiedType":
                return this.parseSpecifiedType(inner_obj);
            case "SpecifiedTypeExpression":
                return this.parseSpecifiedTypeExpression(inner_obj);
            case "StringLiteral":
                return this.parseStringLiteral(inner_obj);
            case "ThrowStatement":
                return this.parseThrowStatement(inner_obj);
            case "TryStatement":
                return this.parseTryStatement(inner_obj);
            case "TypeConstraint":
                return this.parseTypeConstraint(inner_obj);
            case "TypedArgument":
                return this.parseTypedArgument(inner_obj);
            case "WhileStatement":
                return this.parseWhileStatement(inner_obj);
            default:
                throw new UnsupportedOperationException(first.getKey());
        }
    }

    JsonObject chain(JsonObject source, String... path) {
        for (String step : path) {
            source = source.get(step).getAsJsonObject();
        }
        return source;
    }

    ArithmeticExpression parseArithmeticExpression(JsonObject source) {
        ArithmeticExpression rc = new ArithmeticExpression(extractSpan(source), source.get("operator").getAsString());
        ASTElement lhs = parseElement(source.get("lhs"));
        if (lhs instanceof Expression) {
            rc.setLHS((Expression) lhs);
        } else {
            throw new IllegalArgumentException();
        }
        ASTElement rhs = parseElement(source.get("rhs"));
        if (rhs instanceof Expression) {
            rc.setRHS((Expression) rhs);
        } else {
            throw new IllegalArgumentException();
        }
        return rc;
    }

    AssignmentStatement parseAssignmentStatement(JsonObject source) {
        AssignmentStatement rc = new AssignmentStatement(extractSpan(source));
        ASTElement lhs = parseElement(source.get("lhs"));
        if (lhs instanceof Expression) {
            rc.setLHS((Expression) lhs);
        } else {
            throw new IllegalArgumentException();
        }
        ASTElement rhs = parseElement(source.get("rhs"));
        if (rhs instanceof Expression) {
            rc.setRHS((Expression) rhs);
        } else {
            throw new IllegalArgumentException();
        }
        return rc;
    }

    NamedType parseBaseType(JsonObject source) {
        return NamedType.build(extractSpan(source), source.get("name").getAsString());
    }

    BooleanInversionExpression parseBooleanInversionExpression(JsonObject source) {
        BooleanInversionExpression rc = new BooleanInversionExpression(extractSpan(source));
        ASTElement b_source = parseElement(source.get("source"));
        if (b_source instanceof Expression) {
            rc.setSource((Expression) b_source);
        } else {
            throw new IllegalArgumentException();
        }
        return rc;
    }

    CatchStatement parseCatchStatement(JsonObject source) {
        CatchStatement rc = new CatchStatement(extractSpan(source), source.get("excname").getAsString());

        ASTElement body = parseElement(source.get("body"));
        if (body instanceof CompoundStatement) {
            rc.setBody((CompoundStatement) body);
        } else {
            throw new IllegalArgumentException();
        }

        ASTElement type = parseElement(source.get("exctype"));
        if (type instanceof TypeElement) {
            rc.setType((TypeElement) type);
        } else {
            throw new IllegalArgumentException();
        }

        return rc;
    }

    Class parseClass(JsonObject source) {
        ClassHeader header = parseClassHeader(chain(source, "header", "ClassHeader"));
        ASTElement[] body = parseElements(
                chain(source, "body", "ClassBody").get("elements").getAsJsonArray());
        Class rc = new Class(extractSpan(source), header.name, header.generics);

        if (header.ext.isPresent()) {
            NamedType ext_type = NamedType.build(header.ext.get().getSpan(), header.ext.get().getName());
            rc.setExtends(ext_type);
        }

        for (TypeElement imp : header.impl) {
            rc.insertImplementation(imp);
        }

        for (ASTElement el : body) {
            if (el instanceof Field) {
                rc.insertField((Field) el);
            } else if (el instanceof Function) {
                rc.insertMethod((Function) el);
            }
        }

        return rc;
    }

    Field parseClassField(JsonObject source) {
        Identifier name = parseIdentifier(chain(source, "fieldname", "Identifier"));
        ASTElement type = parseElement(source.get("fieldtype"));
        if (type instanceof TypeElement) {
            Field rc = new Field(extractSpan(source), name.getName(), source.get("is_static").getAsBoolean());
            rc.setType((TypeElement) type);
            return rc;
        } else {
            throw new IllegalArgumentException();
        }
    }

    ClassHeader parseClassHeader(JsonObject source) {
        Identifier name = parseIdentifier(chain(source, "name", "Identifier"));
        List<String> generics = new ArrayList<String>();

        if (!source.get("generics").isJsonNull()) {
            JsonArray generics_raw = chain(source, "generics", "GenericList").get("names").getAsJsonArray();
            for (JsonElement el : generics_raw) {
                ASTElement parsed = parseElement(el);
                if (parsed instanceof Identifier) {
                    generics.add(((Identifier) parsed).getName());
                } else if (parsed instanceof TypeConstraint) {
                    generics.add(((TypeConstraint) parsed).getName());
                }
            }
        }

        Optional<Identifier> ext = Optional.empty();
        if (!source.get("extends").isJsonNull()) {
            ext = Optional.of(parseIdentifier(chain(source, "extends", "Identifier")));
        }

        JsonArray impl_raw = source.get("implements").getAsJsonArray();
        List<TypeElement> impl = new ArrayList<>();
        for (JsonElement el : impl_raw) {
            TypeElement parsed = (TypeElement) parseElement(el);
            impl.add(parsed);
        }

        return new ClassHeader(extractSpan(source), name.getName(), generics, ext, impl);
    }

    CompoundStatement parseCompoundStatement(JsonObject source) {
        CompoundStatement rc = new CompoundStatement(extractSpan(source));
        JsonArray body_raw = source.get("statements").getAsJsonArray();
        for (JsonElement el : body_raw) {
            ASTElement statement = parseElement(el);
            if (statement instanceof Statement) {
                rc.insertStatement((Statement) statement);
            } else {
                throw new IllegalArgumentException();
            }
        }
        return rc;
    }

    ConstructorCallExpression parseConstructorCallExpression(JsonObject source) {
        ConstructorCallExpression rc = new ConstructorCallExpression(extractSpan(source));

        ASTElement c_source = parseElement(source.get("source"));
        if (c_source instanceof TypeElement) {
            rc.setSource((TypeElement) c_source);
        } else {
            throw new IllegalArgumentException();
        }

        JsonArray args_raw = chain(source, "args", "ArgumentList").get("args").getAsJsonArray();
        for (JsonElement el : args_raw) {
            ASTElement arg = parseElement(el);
            if (arg instanceof Expression) {
                rc.insertArgument((Expression) arg);
            } else {
                throw new IllegalArgumentException();
            }
        }
        return rc;
    }

    ElseIfStatement parseElseIfStatement(JsonObject source) {
        ElseIfStatement rc = new ElseIfStatement(extractSpan(source));

        ASTElement condition = parseElement(source.get("condition"));
        if (condition instanceof Expression) {
            rc.setCondition((Expression) condition);
        } else {
            throw new IllegalArgumentException();
        }

        ASTElement body = parseElement(source.get("body"));
        if (body instanceof CompoundStatement) {
            rc.setBody((CompoundStatement) body);
        } else {
            throw new IllegalArgumentException();
        }

        return rc;
    }

    ElseStatement parseElseStatement(JsonObject source) {
        ElseStatement rc = new ElseStatement(extractSpan(source));

        ASTElement body = parseElement(source.get("body"));
        if (body instanceof CompoundStatement) {
            rc.setBody((CompoundStatement) body);
        } else {
            throw new IllegalArgumentException();
        }

        return rc;
    }

    FieldReferenceExpression parseFieldReferenceExpression(JsonObject source) {
        FieldReferenceExpression rc = new FieldReferenceExpression(extractSpan(source),
                source.get("name").getAsString());

        ASTElement f_source = parseElement(source.get("source"));
        if (f_source instanceof Expression) {
            rc.setSource((Expression) f_source);
        } else {
            throw new IllegalArgumentException();
        }

        return rc;
    }

    Function parseFunction(JsonObject source) {
        ASTElement header_raw = parseElement(source.get("header"));
        if (header_raw instanceof Function) {
            Function header_only = (Function) header_raw;
            ASTElement body = parseElement(source.get("body"));
            if (body instanceof CompoundStatement) {
                header_only.setBody((CompoundStatement) body);
                return header_only;
            } else {
                throw new IllegalArgumentException();
            }
        } else {
            throw new IllegalArgumentException();
        }
    }

    FunctionCallExpression parseFunctionCallExpression(JsonObject source) {
        FunctionCallExpression rc = new FunctionCallExpression(extractSpan(source));

        ASTElement c_source = parseElement(source.get("source"));
        if (c_source instanceof Expression) {
            rc.setSource((Expression) c_source);
        } else {
            throw new IllegalArgumentException();
        }

        JsonArray args_raw = chain(source, "args", "ArgumentList").get("args").getAsJsonArray();
        for (JsonElement el : args_raw) {
            ASTElement arg = parseElement(el);
            if (arg instanceof Expression) {
                rc.insertArgument((Expression) arg);
            } else {
                throw new IllegalArgumentException();
            }
        }
        return rc;
    }

    Function parseFunctionDeclaration(JsonObject source) {
        Identifier name = parseIdentifier(chain(source, "name", "Identifier"));
        JsonArray args_raw = chain(source, "args", "TypedArgumentList").get("args").getAsJsonArray();
        Function rc = new Function(extractSpan(source), source.get("is_static").getAsBoolean(),
                source.get("is_extern").getAsBoolean(), name.getName());
        for (JsonElement el : args_raw) {
            Argument parsed = parseTypedArgument(el.getAsJsonObject().get("TypedArgument").getAsJsonObject());
            rc.insertArgument(parsed);
        }
        ASTElement returntype = parseElement(source.get("returntype"));
        if (returntype instanceof TypeElement) {
            rc.setReturn((TypeElement) returntype);
        } else {
            throw new IllegalArgumentException();
        }
        JsonArray throws_raw = source.get("throws").getAsJsonArray();
        for (JsonElement el : throws_raw) {
            ASTElement parsed = parseElement(el);
            if (parsed instanceof TypeElement) {
                rc.insertThrow((TypeElement) parsed);
            } else {
                throw new IllegalArgumentException();
            }
        }
        return rc;
    }

    FunctionType parseFunctionType(JsonObject source) {
        JsonArray args_raw = chain(source, "args", "TypedArgumentList").get("args").getAsJsonArray();
        LambdaType rc = new LambdaType(extractSpan(source));
        for (JsonElement el : args_raw) {
            Argument parsed = parseTypedArgument(el.getAsJsonObject().get("TypedArgument").getAsJsonObject());
            rc.insertArgument(parsed.getOwnType());
        }
        ASTElement returntype = parseElement(source.get("returntype"));
        if (returntype instanceof TypeElement) {
            rc.setReturn((TypeElement) returntype);
        } else {
            throw new IllegalArgumentException();
        }

        return rc;
    }

    Identifier parseIdentifier(JsonObject source) {
        return new Identifier(extractSpan(source), source.get("name").getAsString());
    }

    IfStatement parseIfStatement(JsonObject source) {
        IfStatement rc = new IfStatement(extractSpan(source));

        ASTElement condition = parseElement(source.get("condition"));
        if (condition instanceof Expression) {
            rc.setCondition((Expression) condition);
        } else {
            throw new IllegalArgumentException();
        }

        ASTElement body = parseElement(source.get("body"));
        if (body instanceof CompoundStatement) {
            rc.setBody((CompoundStatement) body);
        } else {
            throw new IllegalArgumentException();
        }

        return rc;
    }

    ImportStatement parseImportStatement(JsonObject source) {
        return new ImportStatement(extractSpan(source), source.get("path").getAsString());
    }

    IndexExpression parseIndexExpression(JsonObject source) {
        IndexExpression rc = new IndexExpression(extractSpan(source));

        ASTElement i_source = parseElement(source.get("source"));
        if (i_source instanceof Expression) {
            rc.setSource((Expression) i_source);
        } else {
            throw new IllegalArgumentException();
        }

        ASTElement index = parseElement(source.get("index"));
        if (index instanceof Expression) {
            rc.setIndex((Expression) index);
        } else {
            throw new IllegalArgumentException();
        }

        return rc;
    }

    Interface parseInterface(JsonObject source) {
        InterfaceHeader header = parseInterfaceHeader(chain(source, "header", "InterfaceHeader"));
        ASTElement[] body = parseElements(
                chain(source, "body", "InterfaceBody").get("elements").getAsJsonArray());
        Interface rc = new Interface(extractSpan(source), header.name, header.generics);

        for (ASTElement el : body) {
            if (el instanceof Function) {
                rc.insertMethod((Function) el);
            }
        }

        return rc;
    }

    InterfaceHeader parseInterfaceHeader(JsonObject source) {
        Identifier name = parseIdentifier(chain(source, "name", "Identifier"));
        List<String> generics = new ArrayList<String>();

        if (!source.get("generics").isJsonNull()) {
            JsonArray generics_raw = chain(source, "generics", "GenericList").get("names").getAsJsonArray();
            for (JsonElement el : generics_raw) {
                Identifier parsed = parseIdentifier(el.getAsJsonObject().get("Identifier").getAsJsonObject());
                generics.add(parsed.getName());
            }
        }

        return new InterfaceHeader(extractSpan(source), name.getName(), generics);
    }

    LocalDefinitionStatement parseLocalDefinitionStatement(JsonObject source) {
        LocalDefinitionStatement rc = new LocalDefinitionStatement(extractSpan(source),
                source.get("name").getAsString());

        ASTElement localtype = parseElement(source.get("localtype"));
        if (localtype instanceof TypeElement) {
            rc.setLocaltype((TypeElement) localtype);
        } else {
            throw new IllegalArgumentException();
        }

        ASTElement initializer = parseElement(source.get("initializer"));
        if (initializer instanceof Expression) {
            rc.setInitializer((Expression) initializer);
        } else {
            throw new IllegalArgumentException();
        }

        return rc;
    }

    MacroCallExpression parseMacroCallExpression(JsonObject source) {
        MacroCallExpression rc = new MacroCallExpression(extractSpan(source), source.get("name").getAsString());
        JsonArray args_raw = chain(source, "args", "ArgumentList").get("args").getAsJsonArray();
        for (JsonElement el : args_raw) {
            ASTElement arg = parseElement(el);
            if (arg instanceof Expression) {
                rc.insertArgument((Expression) arg);
            } else {
                throw new IllegalArgumentException();
            }
        }
        return rc;
    }

    ModStatement parseModStatement(JsonObject source) {
        return new ModStatement(extractSpan(source), source.get("path").getAsString());
    }

    NameExpression parseNameExpression(JsonObject source) {
        return new NameExpression(extractSpan(source), source.get("name").getAsString());
    }

    NumberExpression parseNumberExpression(JsonObject source) {
        return new NumberExpression(extractSpan(source), source.get("as_text").getAsString());
    }

    RawPointerType parseRawPointerType(JsonObject source) {
        ASTElement inner = parseElement(source.get("inner"));
        if (inner instanceof TypeElement) {
            RawPointerType rc = new RawPointerType(extractSpan(source));
            rc.setInner((TypeElement) inner);
            return rc;
        } else {
            throw new IllegalArgumentException();
        }
    }

    ReturnStatement parseReturnStatement(JsonObject source) {
        ReturnStatement rc = new ReturnStatement(extractSpan(source));
        if (!source.get("source").isJsonNull()) {
            ASTElement r_source = parseElement(source.get("source"));
            if (r_source instanceof Expression) {
                rc.setSource((Expression) r_source);
            } else {
                throw new IllegalArgumentException();
            }
        }
        return rc;
    }

    SimpleStatement parseSimpleStatement(JsonObject source) {
        SimpleStatement rc = new SimpleStatement(extractSpan(source));
        ASTElement expression = parseElement(source.get("expression"));
        if (expression instanceof Expression) {
            rc.setExpression((Expression) expression);
        } else {
            throw new IllegalArgumentException();
        }
        return rc;
    }

    SpecifiedType parseSpecifiedType(JsonObject source) {
        SpecifiedType rc = new SpecifiedType(extractSpan(source));
        ASTElement base = parseElement(source.get("base"));
        if (base instanceof TypeElement) {
            rc.setBase((TypeElement) base);
        } else {
            throw new IllegalArgumentException();
        }

        JsonArray parameters_raw = chain(source, "parameters", "TypeParameterList").get("parameters").getAsJsonArray();
        for (JsonElement el : parameters_raw) {
            ASTElement parameter = parseElement(el);
            if (parameter instanceof TypeElement) {
                rc.insertParameter((TypeElement) parameter);
            } else {
                throw new IllegalArgumentException();
            }
        }

        return rc;
    }

    SpecifiedTypeExpression parseSpecifiedTypeExpression(JsonObject source) {
        SpecifiedTypeExpression rc = new SpecifiedTypeExpression(extractSpan(source));
        ASTElement base = parseElement(source.get("base"));
        if (base instanceof Expression) {
            rc.setSource((Expression) base);
        } else {
            throw new IllegalArgumentException();
        }

        JsonArray parameters_raw = chain(source, "parameters", "TypeParameterList").get("parameters").getAsJsonArray();
        for (JsonElement el : parameters_raw) {
            ASTElement parameter = parseElement(el);
            if (parameter instanceof TypeElement) {
                rc.insertParameter((TypeElement) parameter);
            } else {
                throw new IllegalArgumentException();
            }
        }

        return rc;
    }

    StringLiteral parseStringLiteral(JsonObject source) {
        return new StringLiteral(extractSpan(source), source.get("contents").getAsString());
    }

    ThrowStatement parseThrowStatement(JsonObject source) {
        ThrowStatement rc = new ThrowStatement(extractSpan(source));
        ASTElement t_source = parseElement(source.get("source"));
        if (t_source instanceof Expression) {
            rc.setSource((Expression) t_source);
        } else {
            throw new IllegalArgumentException();
        }
        return rc;
    }

    TryStatement parseTryStatement(JsonObject source) {
        TryStatement rc = new TryStatement(extractSpan(source));

        ASTElement body = parseElement(source.get("body"));
        if (body instanceof CompoundStatement) {
            rc.setBody((CompoundStatement) body);
        } else {
            throw new IllegalArgumentException();
        }

        return rc;
    }

    TypeConstraint parseTypeConstraint(JsonObject source) {
        ASTElement base = parseElement(source.get("source"));
        TypeConstraint rc = new TypeConstraint(extractSpan(source), ((Identifier) base).getName());

        JsonArray parameters_raw = chain(source, "ctype", "TypeParameterList").get("parameters").getAsJsonArray();
        for (JsonElement el : parameters_raw) {
            ASTElement parameter = parseElement(el);
            if (parameter instanceof TypeElement) {
                rc.insertConstraint((TypeElement) parameter);
            } else {
                throw new IllegalArgumentException();
            }
        }

        return rc;
    }

    Argument parseTypedArgument(JsonObject source) {
        Identifier name = parseIdentifier(chain(source, "argname", "Identifier"));
        ASTElement type = parseElement(source.get("argtype"));
        if (type instanceof TypeElement) {
            Argument rc = new Argument(extractSpan(source), name.getName());
            rc.setType((TypeElement) type);
            return rc;
        } else {
            throw new IllegalArgumentException();
        }
    }

    WhileStatement parseWhileStatement(JsonObject source) {
        WhileStatement rc = new WhileStatement(extractSpan(source));

        ASTElement condition = parseElement(source.get("condition"));
        if (condition instanceof Expression) {
            rc.setCondition((Expression) condition);
        } else {
            throw new IllegalArgumentException();
        }

        ASTElement body = parseElement(source.get("body"));
        if (body instanceof CompoundStatement) {
            rc.setBody((CompoundStatement) body);
        } else {
            throw new IllegalArgumentException();
        }

        return rc;
    }

    Span extractSpan(JsonObject source) {
        return Span.fromJson(this.context, source_path, source.get("span"));
    }

    // CST-only elements below this line
    static class ClassHeader extends ASTElement {
        String name;
        List<String> generics;
        Optional<Identifier> ext;
        List<TypeElement> impl;

        public ClassHeader(Span span, String name, List<String> generics, Optional<Identifier> ext,
                List<TypeElement> impl) {
            super(span);
            this.name = name;
            this.generics = generics;
            this.ext = ext;
            this.impl = impl;
        }

        public ASTElement detach() {
            throw new UnsupportedOperationException();
        }

        public String format() {
            throw new UnsupportedOperationException();
        }

        public void transform(ASTTransformer t) {
            throw new UnsupportedOperationException();
        }
    }

    static class InterfaceHeader extends ASTElement {
        String name;
        List<String> generics;

        public InterfaceHeader(Span span, String name, List<String> generics) {
            super(span);
            this.name = name;
            this.generics = generics;
        }

        public ASTElement detach() {
            throw new UnsupportedOperationException();
        }

        public String format() {
            throw new UnsupportedOperationException();
        }

        public void transform(ASTTransformer t) {
            throw new UnsupportedOperationException();
        }
    }
}
