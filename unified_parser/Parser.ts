import { NameToken } from "../lexer/NameToken";
import { NumericLiteralToken } from "../lexer/NumericLiteralToken";
import { Token } from "../lexer/Token";
import { TokenType } from "../lexer/TokenType";
import { init_types, TypeRegistry } from "../registry/TypeRegistry";
import { ASTElement, isAstElement, TokenStream, VoidElement } from "./ASTElement";
import { Assert, First, InOrder, Invert, Literal, Matcher, Optional, Star } from "./Matcher";
import { SimpleStatement } from "./SimpleStatement";
import { AssignmentStatement } from "./AssignmentStatement";
import { NumericLiteralExpression } from "./NumericLiteralExpression";
import { FunctionCallExpression } from "./FunctionCallExpression";
import { VariableReferenceExpression } from "./VariableReferenceExpression";
import { FieldReferenceExpression } from "./FieldReferenceExpression";
import { ClassType, FunctionType, PassthroughType, TypeObject } from "./TypeObject";
import { ClassConstruct } from "./ClassConstruct";
import { ApplyToAll, ExtractClassTypes, ReplaceTypes, SpecifyClassFields, SpecifyStatements, GenerateScopes, PropagateLocalDefinitions, ReferenceLocals, SpecifyMethodReferences, SpecifyFieldReferences, AddSelfToMethodCalls, SpecifyFunctionCalls, IndirectMethodReferences, AddTypeRequestsToCalls, RemoveRedundantTypeRequests, SpecifyNumericLiterals, SpecifyNews } from "../transformers/Transformer";
import { StaticTableInitialization } from "./StaticTableInitialization";
import { StaticFunctionReference } from "./StaticFunctionReference";
import { StaticFunctionRegistry, StaticVariableRegistry } from "../registry/StaticVariableRegistry";
import { NullaryReturnExpression } from "./NullaryReturnExpression";
import { UnaryReturnExpression } from "./UnaryReturnExpression";
import { AssignmentExpression } from "./AssignmentExpression";
import { FunctionConstruct } from "./FunctionConstruct";
import { NewExpression } from "./NewExpression";

export function Parse(token_stream: Token[]) {
    init_types();
    ApplyPass(token_stream, FindTopLevelConstructs);

    ApplyToAll(ReplaceTypes);
    ApplyToAll(SpecifyNews);
    ApplyToAll(SpecifyClassFields);

    GenerateStaticTables();
    GenerateInitializers();

    ApplyToAll(SpecifyStatements);
    ApplyToAll(GenerateScopes);
    ApplyToAll(PropagateLocalDefinitions);
    ApplyToAll(ReferenceLocals);
    ApplyToAll(SpecifyMethodReferences);
    ApplyToAll(AddSelfToMethodCalls);
    ApplyToAll(IndirectMethodReferences);
    ApplyToAll(SpecifyFieldReferences);
    ApplyToAll(SpecifyFunctionCalls);
    ApplyToAll(AddTypeRequestsToCalls);
    ApplyToAll(RemoveRedundantTypeRequests);
    ApplyToAll(SpecifyNumericLiterals);

    RemoveClassMethods();
    AddStandardLibraryReferences();
}

export function ApplyPass(stream: (Token | ASTElement)[], pass: Pass): TokenStream {
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
                    const repl = rule.replace(stream.slice(ptr, ptr + m.length));
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
    replace: (input: TokenStream) => TokenStream;
    startOnly?: boolean,
}

type Pass = {
    name: string,
    rules: ProductionRule[]
}

export class ParseError extends VoidElement {
    description: string;
    constructor(description: string) {
        super();
        this.description = description;
    }

    toString = () => `ParseError: ${this.description}`;
}

export class ModuleConstruct extends VoidElement {
    name: string;
    constructor(name: string) {
        super();
        this.name = name;
    }
    toString = () => `Module(${this.name})`;
}

export class PartialClassConstruct extends VoidElement {
    name: string;
    source: TokenStream;
    constructor(name: string, source: TokenStream) {
        super();
        this.name = name;
        this.source = [...source];
    }

    parse(): ClassConstruct | ParseError {
        const rc = new ClassConstruct(this.name);
        const body = ApplyPass(this.source, ParseClassBody);
        for (const item of body) {
            if (item instanceof ClassField) {
                rc.fields.push(item);
            } else if (item instanceof FunctionConstruct) {
                item.args.unshift(new ArgumentDefinition("self", new UnresolvedTypeLiteral(this.name)));
                rc.methods.push(item);
            }
        }
        return rc;
    }

    toString = () => `PartialClass(${this.name})`;
}

export class PartialFunctionConstruct extends ASTElement {
    name: string;
    source: TokenStream;
    constructor(name: string, source: TokenStream) {
        super();
        this.name = name;
        this.source = [...source];
    }

    parse(should_register = false): FunctionConstruct | ParseError {
        const rc = new FunctionConstruct(this.name);
        const body = ApplyPass(this.source, ParseFunctionBody);
        if (body[0] instanceof UnresolvedTypeLiteral) rc.return_type_literal = body[0];
        if (body[1] instanceof ArgumentList) rc.args = body[1].args;
        if (body[2] instanceof CompoundStatement) rc.body = body[2];
        if (should_register) {
            StaticFunctionRegistry.set(this.name, rc);
        }
        return rc;
    }

    toString = () => `PartialFunction(${this.name})`;
}

export class UnresolvedTypeLiteral extends ASTElement {
    name: string;
    constructor(name: string) {
        super();
        this.name = name;
    }
    toString = () => `Type(${this.name})`;
}

export class TypeLiteral extends ASTElement {
    constructor(type: TypeObject) {
        super(type);
    }

    toString = () => `!!TL!! ${this.value_type.toString()}`;
}

export class ClassField extends ASTElement {
    name: string;
    type_literal: UnresolvedTypeLiteral | TypeLiteral;
    constructor(name: string, type: UnresolvedTypeLiteral | TypeLiteral) {
        super();
        this.name = name;
        this.type_literal = type;
        if (type instanceof TypeLiteral) this.value_type = type.value_type;
    }
    toString = () => `ClassField<${this.type_literal.toString()}>(${this.name})`;
}

export class ArgumentDefinition extends ASTElement {
    name: string;
    type_literal: UnresolvedTypeLiteral | TypeLiteral;
    constructor(name: string, type: UnresolvedTypeLiteral | TypeLiteral) {
        super();
        this.name = name;
        this.type_literal = type;
    }
    toString = () => `ArgumentDefinition<${this.type_literal.toString()}>(${this.name})`;
}

export class ArgumentList extends ASTElement {
    args: ArgumentDefinition[] = [];
    constructor(args: ArgumentDefinition[]) {
        super();
        this.args = args;
    }
    toString = () => `ArgumentList`;
}

export class CompoundStatement extends VoidElement {
    substatements: ASTElement[];
    source: TokenStream;
    constructor(source?: TokenStream) {
        super();
        this.source = source;
    }
    parse(): CompoundStatement {
        this.source = ApplyPass(this.source.slice(1, this.source.length - 1), {
            name: "CompoundStatement",
            rules: [{
                name: "RecognizeSubCompounds",
                match: InOrder(Assert(Literal("OpenBrace")), Braces()),
                replace: (input: TokenStream) => [new CompoundStatement(input).parse()]
            }]
        });
        this.source = ApplyPass(this.source, ExpressionPass);
        this.source = ApplyPass(this.source, {
            name: "SimpleStatements",
            rules: [{
                name: "SplitSimpleStatements",
                match: InOrder(Invert(Literal("SimpleStatement")), Star(Invert(Literal("Semicolon"))), Literal("Semicolon")),
                replace: (input: TokenStream) => [new SimpleStatement(input.slice(0, input.length - 1))]
            }]
        });
        this.substatements = this.source.filter(x => isAstElement(x)) as ASTElement[];
        return this;
    }
    toString = () => `CompoundStatement`;
}

export class PartialFieldReference extends ASTElement {
    field: string;
    constructor(field: string) {
        super();
        this.field = field;
    }
    toString = () => `.${this.field}`;
}

export class NameExpression extends ASTElement {
    name: string;
    constructor(name: string) {
        super();
        this.name = name;
    }
    toString = () => `'${this.name}`;
}

export class LocalDefinition extends VoidElement {
    name: NameExpression;
    type_literal: UnresolvedTypeLiteral | TypeLiteral;

    constructor(name: NameExpression, type: UnresolvedTypeLiteral | TypeLiteral) {
        super();
        this.name = name;
        this.type_literal = type;
    }

    toString = () => `let ${this.name.toString()} ${this.type_literal.toString()}`
}

export class ElidedElement extends VoidElement {
    toString = () => "<elided>";
}

const MatchFunctionDefinitions = {
    name: "FunctionConstruct",
    match: InOrder(
        Optional(Literal("Static")),
        Literal("Function"),
        Type(),
        Literal("Name"),
        Assert(Literal("OpenParen")),
        Braces(),
        First(
            InOrder(
                Assert(Literal("OpenBrace")),
                Braces()
            ),
            Literal("Semicolon")
        )),
    replace: (input: TokenStream) => {
        let idx = 0;
        while (!(Literal("OpenParen")(input.slice(idx)).matched))
            idx++;
        return [new PartialFunctionConstruct((input[idx - 1] as NameToken).name, input).parse(input[0]['type'] == TokenType.Static)];
    }
};

const FindTopLevelConstructs: Pass = {
    name: "FindTopLevelConstructs",
    rules: [
        {
            name: "ModuleConstruct",
            match: InOrder(Literal("Module"), Literal("Name"), Literal("Semicolon")),
            replace: (input: [Token, NameToken, Token]) => [
                new ModuleConstruct(input[1].name)
            ]
        },
        {
            name: "ClassConstruct",
            match: InOrder(Literal("Class"), Literal("Name"), Assert(Literal("OpenBrace")), Braces()),
            replace: (input: [Token, NameToken, ...(Token | ASTElement)[]]) => [
                new PartialClassConstruct(input[1].name, input).parse()
            ]
        },
        MatchFunctionDefinitions
    ]
};

const ParseClassBody: Pass = {
    name: "ParseClassBody",
    rules: [
        {
            name: "DropNameAndBraces",
            match: InOrder(Literal("Class"), Literal("Name"), Assert(Literal("OpenBrace")), Braces()),
            replace: (input: TokenStream) => {
                return input.slice(3, input.length - 1);
            }
        },
        {
            name: "MatchClassFields",
            match: InOrder(Type(), Literal("Name"), Literal("Semicolon")),
            replace: (input: TokenStream) => {
                const name = (input[input.length - 2] as NameToken).name;
                const type = ApplyPass(input.slice(0, input.length - 2), ParseType)[0];
                if (!(type instanceof UnresolvedTypeLiteral)) return undefined;
                return [new ClassField(name, type)];
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
            match: InOrder(Type(), Literal("Name"), Assert(Literal("OpenParen"))),
            replace: (input: TokenStream) => {
                const type = ApplyPass(input.slice(0, input.length - 1), ParseType)[0];
                if (!(type instanceof UnresolvedTypeLiteral)) return undefined;
                return [type];
            },
            startOnly: true
        },
        {
            name: "MatchArgumentList",
            match: InOrder(
                Literal("UnresolvedTypeLiteral"),
                Literal("OpenParen"),
                Optional(
                    InOrder(
                        Type(), Literal("Name"),
                        Star(InOrder(Literal("Comma"), Type(), Literal("Name"))),
                        Optional(Literal("Comma")),
                    )
                ),
                Star(Type()),
                Literal("CloseParen")),
            replace: (input: [UnresolvedTypeLiteral, ...TokenStream]) => {
                const args = ApplyPass(input.slice(2, input.length - 1), {
                    name: "ConvertArguments",
                    rules: [
                        {
                            name: "ConvertArgument",
                            match: InOrder(Type(), Literal("Name"), Optional(Literal("Comma"))),
                            replace: (input: TokenStream) => {
                                const [type, name] = ApplyPass(input, ParseType);
                                if (!(type instanceof UnresolvedTypeLiteral)) return undefined;
                                if (!(name['type'] == TokenType.Name)) return undefined;
                                return [new ArgumentDefinition(name['name'], type)];
                            }
                        }
                    ]
                });
                return [input[0], new ArgumentList(args as ArgumentDefinition[])];
            },
            startOnly: true
        },
        {
            name: "MatchFunctionBody",
            match: InOrder(Literal("UnresolvedTypeLiteral"), Literal("ArgumentList"), Assert(Literal("OpenBrace")), Braces()),
            replace: (input: [UnresolvedTypeLiteral, ArgumentList, ...TokenStream]) => [input[0], input[1], new CompoundStatement(input.slice(2)).parse()],
            startOnly: true
        },
    ]
}

const ParseType: Pass = {
    name: "ParseType",
    rules: [
        {
            name: "Simple",
            match: Literal("Name"),
            replace: (input: [NameToken]) => {
                return [new UnresolvedTypeLiteral(input[0].name)];
            },
            startOnly: true
        }
    ]
};

const ExpressionPass: Pass = {
    name: "ExpressionPass",
    rules: [
        {
            name: "ConvertNumericLiterals",
            match: Literal("NumericLiteral"),
            replace: (input: [NumericLiteralToken]) => [new NumericLiteralExpression(input[0].value)]
        },
        {
            name: "FieldReference1",
            match: InOrder(Literal("Period"), Literal("Name")),
            replace: (input: [Token, NameToken]) => [new PartialFieldReference(input[1].name)]
        },
        {
            name: "ConvertNames",
            match: Literal("Name"),
            replace: (input: [NameToken]) => [new NameExpression(input[0].name)]
        },
        {
            name: "FieldReference2",
            match: InOrder(MatchElement(), Literal("PartialFieldReference")),
            replace: (input: [ASTElement, PartialFieldReference]) => [new FieldReferenceExpression(input[0], input[1].field)]
        },
        {
            name: "New",
            match: InOrder(Literal("New"), Literal("NameExpression")),
            replace: (input: [Token, NameExpression]) => [new NewExpression(new UnresolvedTypeLiteral(input[1].name))]
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
            replace: (input: [ASTElement, Token, ...TokenStream]) => {
                const rhs = input[0];
                const rest = input.slice(2, input.length - 1);
                const args: ASTElement[] = [];
                for (const exp of rest) {
                    // TODO is this correct? I *think* so based on the match invariants, but it's sketchy
                    if (isAstElement(exp)) {
                        args.push(exp);
                    }
                }
                return [new FunctionCallExpression(rhs, args)];
            }
        },
        {
            name: "LocalDefinition",
            match: InOrder(Literal("Let"), Literal("NameExpression"), MatchElement(), Assert(Literal("Semicolon"))),
            replace: (input: [Token, NameExpression, ASTElement]) => [new LocalDefinition(input[1], input[2])]
        },
        {
            name: "Assignment",
            match: InOrder(MatchElement(), Literal("Equals"), MatchElement(), Assert(Literal("Semicolon"))),
            replace: (input: [ASTElement, Token, ASTElement]) => [new AssignmentExpression(input[0], input[2])]
        },
        {
            name: "MatchUnaryReturn",
            match: InOrder(Literal("Return"), MatchElement(), Assert(Literal("Semicolon"))),
            replace: (input: [Token, ASTElement]) => [new UnaryReturnExpression(input[1])]
        },
        {
            name: "MatchNullaryReturn",
            match: InOrder(Literal("Return"), Assert(Literal("Semicolon"))),
            replace: (input: [Token]) => [new NullaryReturnExpression()]
        }
    ]
}

function GenerateStaticTables() {
    for (const [_, t] of TypeRegistry) {
        if (!(t instanceof ClassType)) continue;
        if (t.source.is_stable || t.source.has_stable) continue;
        const stable = new ClassConstruct(`__${t.source.name}_stable_t`);
        const initializer = new StaticTableInitialization(t.source);
        stable.is_stable = true;
        t.source.has_stable = true;

        for (const method of t.source.methods) {
            const method_type = new FunctionType(method.return_type_literal.value_type, method.args.map(x => x.type_literal.value_type));
            stable.fields.push(new ClassField(method.name, new TypeLiteral(method_type)));
            initializer.fields.push(new StaticFunctionReference(`__${t.source.name}_${method.name}`, method_type));
        }

        TypeRegistry.set(stable.name, new ClassType(stable));
        StaticVariableRegistry.set(`__${t.source.name}_stable`, { type: TypeRegistry.get(stable.name), initializer: initializer });
        t.source.fields.unshift(new ClassField("__stable", new TypeLiteral(TypeRegistry.get(stable.name))))
    }
}

function GenerateInitializers() {
    for (const [_, t] of TypeRegistry) {
        if (!(t instanceof ClassType)) continue;
        if (t.source.is_stable) continue;

        const fn = new FunctionConstruct(`__${t.source.name}_initialize`);
        fn.args.push(new ArgumentDefinition("self", new TypeLiteral(t)));
        fn.return_type_literal = new TypeLiteral(TypeRegistry.get("void"));

        fn.body = new CompoundStatement();
        fn.body.substatements = [
            new AssignmentStatement(new AssignmentExpression(
                new FieldReferenceExpression(new VariableReferenceExpression(t, "self"), "__stable"),
                new VariableReferenceExpression(TypeRegistry.get(`__${t.source.name}_stable_t`), `__${t.source.name}_stable`))),
            new NullaryReturnExpression()
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
    const calloc = new FunctionConstruct("calloc");
    calloc.return_type_literal = new TypeLiteral(new PassthroughType("i8*"));
    calloc.args = [
        new ArgumentDefinition("count", new TypeLiteral(new PassthroughType("i64"))),
        new ArgumentDefinition("size", new TypeLiteral(new PassthroughType("i64")))
    ];
    StaticFunctionRegistry.set("calloc", calloc);
}

function Braces(): Matcher {
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

function Type(): Matcher {
    return Literal("Name");
}

function Rvalue(): Matcher {
    return First(Literal("NumericLiteralExpression"));
}

function MatchElement(): Matcher {
    return (stream: TokenStream) => {
        if (isAstElement(stream[0])) return { matched: true, length: 1 };
        return { matched: false, length: 0 };
    }
}