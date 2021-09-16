import { NameToken } from "../lexer/NameToken";
import { NumericLiteralToken } from "../lexer/NumericLiteralToken";
import { StringLiteralToken } from "../lexer/StringLiteralToken";
import { Token } from "../lexer/Token";
import { TokenType } from "../lexer/TokenType";
import { StaticFunctionRegistry, StaticVariableRegistry } from "../registry/StaticVariableRegistry";
import { GetType, init_types, IsType, TypeRegistry } from "../registry/TypeRegistry";
import { FixHierarchy } from "../transformers/Transformer";
import { RunTypeInference } from "../transformers/TypeInference";
import { ArithmeticExpression } from "./ArithmeticExpression";
import { AssignmentExpression } from "./AssignmentExpression";
import { ASTElement, isAstElement, TokenStream } from "./ASTElement";
import { ClassConstruct, PartialClassConstruct } from "./ClassConstruct";
import { ComparisonExpression } from "./ComparisonExpression";
import { CompoundStatement } from "./CompoundStatement";
import { FieldReferenceExpression } from "./FieldReferenceExpression";
import { FunctionCallExpression } from "./FunctionCallExpression";
import { FunctionConstruct } from "./FunctionConstruct";
import { Assert, Braces, BracesWithAngle, First, InOrder, Literal, Matcher, Optional, Star } from "./Matcher";
import { MatchFunctionDefinitions } from "./MatchFunctionDefinitions";
import { NewExpression } from "./NewExpression";
import { NullaryReturnExpression } from "./NullaryReturnExpression";
import { NumericLiteralExpression } from "./NumericLiteralExpression";
import { ParseFunctionBody } from "./ParseFunctionBody";
import { RawPointerIndexExpression } from "./RawPointerIndexExpression";
import { SimpleStatement } from "./SimpleStatement";
import { StaticFunctionReference } from "./StaticFunctionReference";
import { StaticTableInitialization } from "./StaticTableInitialization";
import { StringLiteralExpression } from "./StringLiteralExpression";
import { ClassType, RawPointerType, TypeObject } from "./TypeObject";
import { UnaryReturnExpression } from "./UnaryReturnExpression";
import { VariableReferenceExpression } from "./VariableReferenceExpression";

export const ConvertTypes = {
    name: "ConvertTypes",
    rules: [{
        name: "ConvertTypes",
        match: Literal("NameExpression"),
        replace: (input: [NameExpression], parent: ASTElement) => {
            if (!IsType(input[0].name))
                return undefined;
            return [new TypeLiteral(parent, GetType(input[0].name))];
        }
    }, {
        name: "RawPointer",
        match: InOrder(Literal("Asterisk"), Literal("TypeLiteral")),
        replace: (input: [Token, TypeLiteral], parent: ASTElement) => {
            return [new TypeLiteral(parent, new RawPointerType(input[1].field_type))]
        }
    }]
};

const ConvertNames = {
    name: "ConvertNames",
    rules: [{
        name: "ConvertNames",
        match: Literal("Name"),
        replace: (input: [NameToken], parent: ASTElement) => [new NameExpression(parent, input[0].name)]
    }]
}

export function Parse(token_stream: Token[]) {
    init_types();
    let stream = ApplyPass(undefined, token_stream, ConvertNames);
    stream = ApplyPass(undefined, stream, FindTypeGeneratingConstructs);
    stream = ApplyPass(undefined, stream, ConvertTypes);

    stream = stream.map(x => {
        if (x instanceof PartialClassConstruct) {
            return x.parse()
        }
        return x;
    });

    stream = ApplyPass(undefined, stream, {
        name: "StaticFunctions",
        rules: [MatchFunctionDefinitions]
    });

    for (const item of stream) {
        if (item instanceof FunctionConstruct && item.function_is_static) {
            StaticFunctionRegistry.set(item.name, item);
        }
    }

    AddStandardLibraryReferences();

    for (const [name, func] of StaticFunctionRegistry) {
        RunTypeInference(func);
    }

    GenerateStaticTables();
    GenerateInitializers();

    RemoveClassMethods();
}

export function ApplyPass(parent: ASTElement, stream: TokenStream, pass: Pass): TokenStream {
    stream = [...stream];
    console.error(`\x1b[1mRunning pass\x1b[0m: ${pass.name}`);
    console.error(`\x1b[1mInput:\x1b[0m [${stream.map(x => x['start'] ? TokenType[x['type']] : x.toString()).join(", ")}]`);
    let did_match = false;
    outer: do {
        did_match = false;
        for (const rule of pass.rules) {
            let ptr = 0;
            inner: for (ptr = 0; ptr < stream.length; ptr++) {
                if (rule.startOnly && ptr > 0) break;
                const m = rule.match(stream.slice(ptr));
                if (m.matched) {
                    const repl = rule.replace(stream.slice(ptr, ptr + m.length), parent);
                    if (!repl) continue inner;
                    console.error(`Applied rule ${rule.name}`);
                    did_match = true;
                    const prev = stream.splice(ptr, m.length, ...repl);
                    console.error(`[${prev.map(x => x['start'] ? TokenType[x['type']] : x.toString()).join(", ")}] => [${repl.map(x => x['start'] ? TokenType[x['type']] : x.toString()).join(", ")}]`);
                    continue outer;
                }
            }
        }
    } while (did_match);
    console.error(`\x1b[1mResult:\x1b[0m [${stream.map(x => x['start'] ? TokenType[x['type']] : x.toString()).join(", ")}]`);
    return stream;
}

export type ProductionRule = {
    name: string,
    match: Matcher,
    replace: (input: TokenStream, parent?: ASTElement) => TokenStream;
    startOnly?: boolean,
}

export type Pass = {
    name: string,
    rules: ProductionRule[]
}

export class ParseError extends ASTElement {
    description: string;
    constructor(parent: ASTElement, description: string) {
        super(parent);
        this.description = description;
    }

    toString = () => `ParseError: ${this.description}`;
}

export class ModuleConstruct extends ASTElement {
    name: string;
    constructor(parent: ASTElement, name: string) {
        super(parent);
        this.name = name;
    }
    toString = () => `Module(${this.name})`;
}

export class PartialFunctionConstruct extends ASTElement {
    name: string;
    source: TokenStream;
    constructor(parent: ASTElement, name: string, source: TokenStream) {
        super(parent);
        this.name = name;
        this.source = [...source];
    }

    parse(is_static = false): FunctionConstruct | ParseError {
        const body = ApplyPass(this, this.source, ParseFunctionBody);
        if (!(body[0] instanceof TypeLiteral)) throw new Error();
        const rctype = body[0].field_type;
        if (!(body[1] instanceof ArgumentList)) throw new Error();
        const rc = new FunctionConstruct(this.parent, this.name, rctype, body[1].args, is_static);

        if (!(body[2] instanceof ASTElement) && body[2].type == TokenType.Semicolon) {
            return rc;
        }

        if (!(body[2] instanceof CompoundStatement)) throw new Error();

        rc.body = body[2];

        rc.walk(FixHierarchy, () => { }, this.parent);
        return rc;
    }

    toString = () => `PartialFunction(${this.name})`;
}

export class TypeLiteral extends ASTElement {
    field_type: TypeObject;

    constructor(parent: ASTElement, type: TypeObject) {
        super(parent);
        this.field_type = type;
    }

    toString = () => `!!TL!! ${this.field_type.toString()}`;
}

export class ClassField extends ASTElement {
    name: string;
    field_type: TypeObject;
    constructor(parent: ASTElement, name: string, type: TypeObject) {
        super(parent);
        this.name = name;
        this.field_type = type;
    }
    toString = () => `ClassField<${this.field_type.toString()}>(${this.name})`;
}

export class ArgumentDefinition extends ASTElement {
    name: string;
    field_type: TypeObject;

    constructor(parent: ASTElement, name: string, type: TypeObject) {
        super(parent);
        this.name = name;
        this.field_type = type;
    }
    toString = () => `ArgumentDefinition<${this.field_type.toString()}>(${this.name})`;
}

export class ArgumentList extends ASTElement {
    args: ArgumentDefinition[] = [];
    constructor(parent: ASTElement, args: ArgumentDefinition[]) {
        super(parent);
        this.args = args;
    }
    toString = () => `ArgumentList`;
}

export class PartialFieldReference extends ASTElement {
    field: string;
    constructor(parent: ASTElement, field: string) {
        super(parent);
        this.field = field;
    }
    toString = () => `.${this.field}`;
}

export class NameExpression extends ASTElement {
    name: string;
    constructor(parent: ASTElement, name: string) {
        super(parent);
        this.name = name;
    }
    toString = () => `'${this.name}`;
}

export class LocalDefinition extends ASTElement {
    name: string;
    local_type: TypeObject;

    constructor(parent: ASTElement, name: string, type: TypeObject) {
        super(parent);
        this.name = name;
        this.local_type = type;
    }

    toString = () => `let ${this.name.toString()} ${this.local_type.toString()}`
}

export class ElidedElement extends ASTElement {
    toString = () => "<elided>";
}

const FindTypeGeneratingConstructs: Pass = {
    name: "FindTopLevelConstructs",
    rules: [
        {
            name: "ModuleConstruct",
            match: InOrder(Literal("Module"), Literal("NameExpression"), Literal("Semicolon")),
            replace: (input: [Token, NameExpression, Token], parent: ASTElement) => [
                new ModuleConstruct(parent, input[1].name)
            ]
        },
        {
            name: "ClassConstruct",
            match: InOrder(Literal("Class"), Literal("NameExpression"), Optional(InOrder(Assert(Literal("OpenAngle")), BracesWithAngle())), Assert(Literal("OpenBrace")), Braces()),
            replace: (input: [Token, NameExpression, ...(Token | ASTElement)[]], parent: ASTElement) => [
                new PartialClassConstruct(parent, input[1].name, input)
            ]
        },
    ]
};

export const LocalDefinitionsPass: Pass = {
    name: "LocalDefinitions",
    rules: [
        {
            name: "LocalDefinition",
            match: InOrder(Literal("Let"), Literal("NameExpression"), Literal("TypeLiteral"), Assert(Literal("Semicolon"))),
            replace: (input: [Token, NameExpression, TypeLiteral, Token], parent: ASTElement) => {
                return [new LocalDefinition(parent, input[1].name, input[2].field_type)];
            }
        }
    ]
};

export const ExpressionPass: Pass = {
    name: "ExpressionPass",
    rules: [
        {
            name: "ConvertNumericLiterals",
            match: Literal("NumericLiteral"),
            replace: (input: [NumericLiteralToken], parent: ASTElement) => [new NumericLiteralExpression(parent, input[0].value)]
        },
        {
            name: "ConvertStringLiterals",
            match: Literal("StringLiteral"),
            replace: (input: [StringLiteralToken], parent: ASTElement) => [new StringLiteralExpression(parent, input[0].str)]
        },
        {
            name: "FieldReference1",
            match: InOrder(Literal("Period"), Literal("NameExpression")),
            replace: (input: [Token, NameExpression], parent: ASTElement) => [new PartialFieldReference(parent, input[1].name)]
        },
        {
            name: "FieldReference2",
            match: InOrder(MatchElement(), Literal("PartialFieldReference")),
            replace: (input: [ASTElement, PartialFieldReference], parent: ASTElement) => [new FieldReferenceExpression(parent, input[0], input[1].field)]
        },
        {
            name: "New",
            match: InOrder(Literal("New"), Literal("TypeLiteral")),
            replace: (input: [Token, TypeLiteral], parent: ASTElement) => [new NewExpression(parent, input[1].field_type)]
        },
        {
            name: "FunctionCall",
            match: InOrder(
                MatchElement(),
                Literal("OpenParen"),
                Optional(
                    InOrder(
                        MatchElement(),
                        Star(InOrder(Literal("Comma"), MatchElement()))
                    )
                ),
                Literal("CloseParen")
            ),
            replace: (input: [ASTElement, Token, ...TokenStream], parent: ASTElement) => {
                const rhs = input[0];
                const rest = input.slice(2, input.length - 1);
                const args: ASTElement[] = [];
                for (const exp of rest) {
                    // TODO is this correct? I *think* so based on the match invariants, but it's sketchy
                    if (isAstElement(exp)) {
                        args.push(exp);
                    }
                }
                return [new FunctionCallExpression(parent, rhs, args)];
            }
        },
        {
            name: "RawPointerIndex",
            match: InOrder(
                MatchElement(),
                Literal("Asterisk"),
                Literal("OpenBracket"),
                MatchElement(),
                Literal("CloseBracket")
            ),
            replace: (input: [ASTElement, Token, Token, ASTElement, ...TokenStream], parent: ASTElement) => {
                return [new RawPointerIndexExpression(parent, input[0], input[3])];
            }
        },
        {
            name: "ParenthesizedSingleElement",
            match: InOrder(Literal("OpenParen"), MatchElement(), Literal("CloseParen")),
            replace: (input: [Token, ASTElement, Token]) => [input[1]],
        },
        {
            name: "Multiply",
            match: InOrder(MatchElement(), Literal("Asterisk"), MatchElement()),
            replace: (input: [ASTElement, Token, ASTElement], parent: ASTElement) => {
                return [new ArithmeticExpression(parent, input[0], input[2], "mul")]
            }
        },
        {
            name: "Add",
            match: InOrder(MatchElement(), Literal("Plus"), MatchElement()),
            replace: (input: [ASTElement, Token, ASTElement], parent: ASTElement) => {
                return [new ArithmeticExpression(parent, input[0], input[2], "add")]
            }
        },
        {
            name: "LessThan",
            match: InOrder(MatchElement(), Literal("OpenAngle"), MatchElement()),
            replace: (input: [ASTElement, Token, ASTElement], parent: ASTElement) => {
                return [new ComparisonExpression(parent, input[0], input[2], "slt")]
            }
        },
        {
            name: "Assignment",
            match: InOrder(MatchElement(), Literal("Equals"), MatchElement(), Assert(Literal("Semicolon"))),
            replace: (input: [ASTElement, Token, ASTElement], parent: ASTElement) => [new AssignmentExpression(parent, input[0], input[2])]
        },
        {
            name: "MatchUnaryReturn",
            match: InOrder(Literal("Return"), MatchElement(), Assert(Literal("Semicolon"))),
            replace: (input: [Token, ASTElement], parent: ASTElement) => [new UnaryReturnExpression(parent, input[1])]
        },
        {
            name: "MatchNullaryReturn",
            match: InOrder(Literal("Return"), Assert(Literal("Semicolon"))),
            replace: (input: [Token], parent: ASTElement) => [new NullaryReturnExpression(parent)]
        }
    ]
}

function GenerateStaticTables() {
    for (const [_, t] of TypeRegistry) {
        if (!(t instanceof ClassType)) continue;
        if (t.source.is_stable || t.source.has_stable) continue;
        if (t.source.generic_fields.length) continue;
        const stable = new ClassConstruct(undefined, `__${t.source.name}_stable_t`);
        const initializer = new StaticTableInitialization(t.source);
        stable.is_stable = true;
        t.source.has_stable = true;

        for (const method of t.source.methods) {
            stable.fields.push(new ClassField(stable, method.name, method.as_type()));
            initializer.fields.push(new StaticFunctionReference(stable, `__${t.source.name}_${method.name}`, method.as_type()));
        }

        TypeRegistry.set(stable.name, new ClassType(stable));
        StaticVariableRegistry.set(`__${t.source.name}_stable`, { type: TypeRegistry.get(stable.name), initializer: initializer });
        t.source.fields.unshift(new ClassField(stable, "__stable", TypeRegistry.get(stable.name)));
    }
}

function GenerateInitializers() {
    for (const [_, t] of TypeRegistry) {
        if (!(t instanceof ClassType)) continue;
        if (t.source.is_stable) continue;
        if (t.source.generic_fields.length) continue;

        const fn = new FunctionConstruct(t.source, `__${t.source.name}_initialize`, GetType("void"), [new ArgumentDefinition(t.source, "self", t)], true);

        fn.body = new CompoundStatement(fn);
        fn.body.substatements = [
            new SimpleStatement(fn.body, [new AssignmentExpression(fn.body,
                new FieldReferenceExpression(fn.body, new VariableReferenceExpression(fn.body, "self"), "__stable"),
                new VariableReferenceExpression(fn.body, `__${t.source.name}_stable`))]),
            new NullaryReturnExpression(fn.body)
        ]

        StaticFunctionRegistry.set(fn.name, fn);
        RunTypeInference(fn, false);
    }
}

function RemoveClassMethods() {
    for (const [_, t] of TypeRegistry) {
        if (!(t instanceof ClassType)) continue;
        if (!t.source.methods.length) return undefined;
        console.error(`[RemoveClassMethods] ${t.source.name}`);
        if (!t.source.generic_fields.length) {
            const real_methods: FunctionConstruct[] = [];
            for (const method of t.source.methods) {
                method.name = `__${t.source.name}_${method.name}`;
                real_methods.push(method);
                StaticFunctionRegistry.set(method.name, method);
            }
        }
        t.source.methods = [];
    }
}

function AddStandardLibraryReferences() {
    const calloc = new FunctionConstruct(undefined, "calloc", new RawPointerType(GetType("i8")), [
        new ArgumentDefinition(undefined, "count", TypeRegistry.get("i64")),
        new ArgumentDefinition(undefined, "size", TypeRegistry.get("i64"))
    ], true);
    StaticFunctionRegistry.set("calloc", calloc);
}

function Rvalue(): Matcher {
    return First(Literal("NumericLiteralExpression"));
}

export function MatchElement(): Matcher {
    return (stream: TokenStream) => {
        if (isAstElement(stream[0])) return { matched: true, length: 1 };
        return { matched: false, length: 0 };
    }
}
