import { NameToken } from "../lexer/NameToken";
import { NumericLiteralToken } from "../lexer/NumericLiteralToken";
import { Token } from "../lexer/Token";
import { TokenType } from "../lexer/TokenType";
import { StaticFunctionRegistry, StaticVariableRegistry } from "../registry/StaticVariableRegistry";
import { GetType, init_types, IsType, TypeRegistry } from "../registry/TypeRegistry";
import { ApplyToAll, FixHierarchy } from "../transformers/Transformer";
import { ApplyIntersections, ImportLocals } from "../transformers/TypeInference";
import { ArithmeticExpression } from "./ArithmeticExpression";
import { AssignmentExpression } from "./AssignmentExpression";
import { AssignmentStatement } from "./AssignmentStatement";
import { ASTElement, isAstElement, TokenStream, VoidElement } from "./ASTElement";
import { ClassConstruct } from "./ClassConstruct";
import { ComparisonExpression } from "./ComparisonExpression";
import { CompoundStatement } from "./CompoundStatement";
import { FieldReferenceExpression } from "./FieldReferenceExpression";
import { FunctionCallExpression } from "./FunctionCallExpression";
import { FunctionConstruct } from "./FunctionConstruct";
import { Assert, First, InOrder, Literal, Matcher, Optional, Star } from "./Matcher";
import { NewExpression } from "./NewExpression";
import { NullaryReturnExpression } from "./NullaryReturnExpression";
import { NumericLiteralExpression } from "./NumericLiteralExpression";
import { RawPointerIndexExpression } from "./RawPointerIndexExpression";
import { StaticFunctionReference } from "./StaticFunctionReference";
import { StaticTableInitialization } from "./StaticTableInitialization";
import { ClassType, FunctionType, RawPointerType, TypeObject } from "./TypeObject";
import { UnaryReturnExpression } from "./UnaryReturnExpression";
import { VariableReferenceExpression } from "./VariableReferenceExpression";

const ConvertTypes = {
    name: "ConvertTypes",
    rules: [{
        name: "ConvertTypes",
        match: Literal("NameExpression"),
        replace: (input: [NameExpression], parent: ASTElement) => {
            if (!IsType(input[0].name))
                return undefined;
            return [new TypeLiteral(parent, GetType(input[0].name))];
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
        console.error(x);
        if (x instanceof PartialClassConstruct) {
            return x.parse()
        }
        return x;
    });

    stream = ApplyPass(undefined, stream, {
        name: "StaticFunctions",
        rules: [MatchFunctionDefinitions]
    });

    AddStandardLibraryReferences();

    let did_apply = true;
    while (did_apply) {
        did_apply = false;
        did_apply ||= ApplyToAll(ImportLocals);
        did_apply ||= ApplyToAll(ApplyIntersections);
    }

    /*
    ApplyToAll(SpecifyStatements);

    GenerateStaticTables();
    GenerateInitializers();

    ApplyToAll(GenerateScopes);
    ApplyToAll(PropagateLocalDefinitions);
    ApplyToAll(ReferenceLocals);
    ApplyToAll(SpecifyMethodReferences);
    */
    //ApplyToAll(IndirectMethodReferences);

    /*
    ApplyToAll(ReplaceTypes);
    ApplyToAll(SpecifyNews);
    ApplyToAll(SpecifyMath);
    ApplyToAll(SpecifyClassFields);

    GenerateStaticTables();
    GenerateInitializers();

    ApplyToAll(GenerateScopes);
    ApplyToAll(PropagateLocalDefinitions);
    ApplyToAll(ReferenceLocals);
    ApplyToAll(SpecifyMethodReferences);
    ApplyToAll(AddSelfToMethodCalls);
    ApplyToAll(IndirectMethodReferences);
    ApplyToAll(SpecifyFieldReferences);
    ApplyToAll(SpecifyFunctionCalls);
    ApplyToAll(SpecifyRawPointerIndexes);

    let did_apply = true;
    while (did_apply) {
        did_apply = false;
        ApplyToAll(AddTypeRequests);
        ApplyToAll(RemoveRedundantTypeRequests);
        did_apply ||= ApplyToAll(SpecifyNumericLiterals);
        did_apply ||= ApplyToAll(SpecifyArithmeticExpressions);
    }

    RemoveClassMethods();
    */
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

type ProductionRule = {
    name: string,
    match: Matcher,
    replace: (input: TokenStream, parent?: ASTElement) => TokenStream;
    startOnly?: boolean,
}

type Pass = {
    name: string,
    rules: ProductionRule[]
}

export class ParseError extends VoidElement {
    description: string;
    constructor(parent: ASTElement, description: string) {
        super(parent);
        this.description = description;
    }

    toString = () => `ParseError: ${this.description}`;
}

export class ModuleConstruct extends VoidElement {
    name: string;
    constructor(parent: ASTElement, name: string) {
        super(parent);
        this.name = name;
    }
    toString = () => `Module(${this.name})`;
}

export class PartialClassConstruct extends VoidElement {
    name: string;
    source: TokenStream;
    constructor(parent: ASTElement, name: string, source: TokenStream) {
        super(parent);
        this.name = name;
        this.source = [...source];
        TypeRegistry.set(this.name, new ClassType(undefined));
    }

    parse(): ClassConstruct | ParseError {
        const rc = new ClassConstruct(this.parent, this.name);
        let body = ApplyPass(this, this.source, ConvertTypes);
        body = ApplyPass(this, body, ParseClassBody);

        for (const item of body) {
            if (item instanceof ClassField) {
                rc.fields.push(item);
            } else if (item instanceof FunctionConstruct) {
                item.args.unshift(new ArgumentDefinition(this.parent, "self", GetType(this.name)));
                item.scope.locals.set("self", GetType(this.name));
                rc.methods.push(item);
            }
        }
        return rc;
    }

    toString = () => `PartialClass(${this.name})`;
}

export class PartialFunctionConstruct extends VoidElement {
    name: string;
    source: TokenStream;
    constructor(parent: ASTElement, name: string, source: TokenStream) {
        super(parent);
        this.name = name;
        this.source = [...source];
    }

    parse(should_register = false): FunctionConstruct | ParseError {
        const body = ApplyPass(this, this.source, ParseFunctionBody);
        if (!(body[0] instanceof TypeLiteral)) throw new Error();
        if (!(body[1] instanceof ArgumentList)) throw new Error();
        if (!(body[2] instanceof CompoundStatement)) throw new Error();

        const rctype = body[0].value_type;
        const argtypes = body[1].args.map(x => x.value_type);
        const fntype = new FunctionType(rctype, argtypes);
        const rc = new FunctionConstruct(this.parent, fntype, this.name, body[1].args);
        rc.body = body[2];

        rc.walk(FixHierarchy, () => { }, this.parent);

        if (should_register) {
            StaticFunctionRegistry.set(this.name, rc);
        }
        return rc;
    }

    toString = () => `PartialFunction(${this.name})`;
}

export class TypeLiteral extends ASTElement {
    constructor(parent: ASTElement, type: TypeObject) {
        super(type, parent);
    }

    toString = () => `!!TL!! ${this.value_type.toString()}`;
}

export class ClassField extends ASTElement {
    name: string;
    constructor(parent: ASTElement, name: string, type: TypeObject) {
        super(type, parent);
        this.name = name;
    }
    toString = () => `ClassField<${this.value_type.toString()}>(${this.name})`;
}

export class ArgumentDefinition extends ASTElement {
    name: string;
    constructor(parent: ASTElement, name: string, type: TypeObject) {
        super(type, parent);
        this.name = name;
    }
    toString = () => `ArgumentDefinition<${this.value_type.toString()}>(${this.name})`;
}

export class ArgumentList extends VoidElement {
    args: ArgumentDefinition[] = [];
    constructor(parent: ASTElement, args: ArgumentDefinition[]) {
        super(parent);
        this.args = args;
    }
    toString = () => `ArgumentList`;
}

export class PartialFieldReference extends VoidElement {
    field: string;
    constructor(parent: ASTElement, field: string) {
        super(parent);
        this.field = field;
    }
    toString = () => `.${this.field}`;
}

export class NameExpression extends VoidElement {
    name: string;
    constructor(parent: ASTElement, name: string) {
        super(parent);
        this.name = name;
    }
    toString = () => `'${this.name}`;
}

export class LocalDefinition extends VoidElement {
    name: string;
    local_type: TypeObject;

    constructor(parent: ASTElement, name: string, type: TypeObject) {
        super(parent);
        this.name = name;
        this.local_type = type;
    }

    toString = () => `let ${this.name.toString()} ${this.local_type.toString()}`
}

export class ElidedElement extends VoidElement {
    toString = () => "<elided>";
}

const MatchFunctionDefinitions = {
    name: "FunctionConstruct",
    match: InOrder(
        Optional(Literal("Static")),
        Literal("Function"),
        Literal("TypeLiteral"),
        Literal("NameExpression"),
        Assert(Literal("OpenParen")),
        Braces(),
        First(
            InOrder(
                Assert(Literal("OpenBrace")),
                Braces()
            ),
            Literal("Semicolon")
        )),
    replace: (input: TokenStream, parent: ASTElement) => {
        let idx = 0;
        while (!(Literal("OpenParen")(input.slice(idx)).matched))
            idx++;
        return [new PartialFunctionConstruct(parent, (input[idx - 1] as NameExpression).name, input).parse(input[0]['type'] == TokenType.Static)];
    }
};

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
            match: InOrder(Literal("Class"), Literal("NameExpression"), Assert(Literal("OpenBrace")), Braces()),
            replace: (input: [Token, NameExpression, ...(Token | ASTElement)[]], parent: ASTElement) => [
                new PartialClassConstruct(parent, input[1].name, input)
            ]
        },
    ]
};

const ParseClassBody: Pass = {
    name: "ParseClassBody",
    rules: [
        {
            name: "DropNameAndBraces",
            match: InOrder(Literal("Class"), Literal("TypeLiteral"), Assert(Literal("OpenBrace")), Braces()),
            replace: (input: TokenStream) => {
                return input.slice(3, input.length - 1);
            }
        },
        {
            name: "MatchClassFields",
            match: InOrder(Literal("TypeLiteral"), Literal("NameExpression"), Literal("Semicolon")),
            replace: (input: [TypeLiteral, NameExpression, Token], parent: ASTElement) => {
                return [new ClassField(parent, input[1].name, input[0].value_type)];
            }
        },
        MatchFunctionDefinitions
    ]
};

const ParseFunctionBody: Pass = {
    name: "ParseFunctionBody",
    rules: [
        {
            name: "DropKeywords",
            match: InOrder(Optional(Literal("Static")), Literal("Function")),
            replace: () => [],
            startOnly: true
        },
        {
            name: "MatchReturnType",
            match: InOrder(Literal("TypeLiteral"), Literal("NameExpression"), Assert(Literal("OpenParen"))),
            replace: (input: [TypeLiteral, NameExpression], parent: ASTElement) => {
                return [input[0]];
            },
            startOnly: true
        },
        {
            name: "MatchArgumentList",
            match: InOrder(
                Literal("TypeLiteral"),
                Literal("OpenParen"),
                Optional(
                    InOrder(
                        Literal("TypeLiteral"), Literal("NameExpression"),
                        Star(InOrder(Literal("Comma"), Literal("TypeLiteral"), Literal("NameExpression"))),
                        Optional(Literal("Comma")),
                    )
                ),
                Star(Literal("TypeLiteral")),
                Literal("CloseParen")),
            replace: (input: [TypeLiteral, ...TokenStream], parent: ASTElement) => {
                const args = ApplyPass(parent, input.slice(2, input.length - 1), {
                    name: "ConvertArguments",
                    rules: [
                        {
                            name: "ConvertArgument",
                            match: InOrder(Literal("TypeLiteral"), Literal("NameExpression"), Optional(Literal("Comma"))),
                            replace: (input: [TypeLiteral, NameExpression]) => {
                                return [new ArgumentDefinition(parent, input[1].name, input[0].value_type)];
                            }
                        }
                    ]
                });
                return [input[0], new ArgumentList(parent, args as ArgumentDefinition[])];
            },
            startOnly: true
        },
        {
            name: "MatchFunctionBody",
            match: InOrder(Literal("TypeLiteral"), Literal("ArgumentList"), Assert(Literal("OpenBrace")), Braces()),
            replace: (input: [TypeLiteral, ArgumentList, ...TokenStream], parent: ASTElement) => [input[0], input[1], new CompoundStatement(parent, input.slice(2)).parse()],
            startOnly: true
        },
    ]
}

export const LocalDefinitionsPass: Pass = {
    name: "LocalDefinitions",
    rules: [
        {
            name: "LocalDefinition",
            match: InOrder(Literal("Let"), Literal("NameExpression"), Literal("TypeLiteral"), Assert(Literal("Semicolon"))),
            replace: (input: [Token, NameExpression, TypeLiteral, Token], parent: ASTElement) => {
                return [new LocalDefinition(parent, input[1].name, input[2].value_type)];
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
            match: InOrder(Literal("New"), Literal("NameExpression")),
            replace: (input: [Token, NameExpression], parent: ASTElement) => [new NewExpression(parent, GetType(input[1].name))]
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
        const stable = new ClassConstruct(undefined, `__${t.source.name}_stable_t`);
        const initializer = new StaticTableInitialization(t.source);
        stable.is_stable = true;
        t.source.has_stable = true;

        for (const method of t.source.methods) {
            stable.fields.push(new ClassField(stable, method.name, method.value_type));
            initializer.fields.push(new StaticFunctionReference(stable, `__${t.source.name}_${method.name}`, method.value_type as FunctionType));
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

        const fn = new FunctionConstruct(t.source, new FunctionType(
            GetType("void"),
            [t],
        ), `__${t.source.name}_initialize`, [new ArgumentDefinition(t.source, "self", t)]);

        fn.body = new CompoundStatement(fn);
        fn.body.substatements = [
            new AssignmentStatement(fn.body, new AssignmentExpression(fn.body,
                new FieldReferenceExpression(fn.body, new VariableReferenceExpression(fn.body, t, "self"), "__stable"),
                new VariableReferenceExpression(fn.body, TypeRegistry.get(`__${t.source.name}_stable_t`), `__${t.source.name}_stable`))),
            new NullaryReturnExpression(fn.body)
        ]

        StaticFunctionRegistry.set(fn.name, fn);
    }
}

function RemoveClassMethods() {
    for (const [_, t] of TypeRegistry) {
        if (!(t instanceof ClassType)) continue;
        if (!t.source.methods.length) return undefined;
        const real_methods: FunctionConstruct[] = [];
        for (const method of t.source.methods) {
            method.name = `__${t.source.name}_${method.name}`;
            real_methods.push(method);
            StaticFunctionRegistry.set(method.name, method);
        }
        t.source.methods = [];
    }
}

function AddStandardLibraryReferences() {
    const calloc = new FunctionConstruct(undefined, new FunctionType(
        new RawPointerType(GetType("i8")), [
        GetType("i64"),
        GetType("i64")
    ]), "calloc", [
        new ArgumentDefinition(undefined, "count", TypeRegistry.get("i64")),
        new ArgumentDefinition(undefined, "size", TypeRegistry.get("i64"))
    ]);
    StaticFunctionRegistry.set("calloc", calloc);
}

export function Braces(): Matcher {
    return (stream: (Token | ASTElement)[]) => {
        let ptr = 0;
        const stack: TokenType[] = [];

        while (ptr < stream.length) {
            const tok = stream[ptr++];
            if (isAstElement(tok)) continue;
            switch (tok.type) {
                case TokenType.OpenBrace:
                    stack.push(TokenType.OpenBrace);
                    break;
                case TokenType.OpenParen:
                    stack.push(TokenType.OpenParen);
                    break;
                case TokenType.CloseBrace:
                    if (stack.pop() != TokenType.OpenBrace) return { matched: false, length: 0 };
                    break;
                case TokenType.CloseParen:
                    if (stack.pop() != TokenType.OpenParen) return { matched: false, length: 0 };
                    break;
            }
            if (stack.length == 0) return { matched: true, length: ptr };
        }
        return { matched: false, length: 0 };
    };
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