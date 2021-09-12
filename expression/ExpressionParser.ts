import { randomUUID } from "crypto";
import { Scope } from "../ast/Scope";
import { ClassRegistry, ClassType, FunctionType, Type, TypeRegistry } from "../generator/TypeRegistry";
import { NameToken } from "../lexer/NameToken";
import { NumericLiteralToken } from "../lexer/NumericLiteralToken";
import { Token } from "../lexer/Token";
import { TokenType } from "../lexer/TokenType";

export function parseExpression(input_stream: Token[], scope: Scope): Expression {
    console.error("Entered expression parser.");
    console.error(`Token stream: [${input_stream.map(x => TokenType[x.type]).join(", ")}]`);

    const stream: (Token | Expression)[] = [...input_stream];
    let did_match = false;
    outer: do {
        did_match = false;
        let ptr = 0;
        for (ptr = 0; ptr < stream.length; ptr++) {
            inner: for (const rule of rules) {
                const m = rule.match(stream.slice(ptr));
                if (m.matched) {
                    console.error(`Applied rule ${rule.name}`);
                    console.error(`\x1b[1m  Stream:\x1b[0m [${stream.map(x => x['start'] ? TokenType[x['type']] : x.toString()).join(", ")}]`);
                    const repl = rule.replace(stream.slice(ptr, ptr + m.length), scope);
                    if (!repl) continue inner;
                    did_match = true;
                    const prev = stream.splice(ptr, m.length, ...repl);
                    console.error(`[${prev.map(x => x['start'] ? TokenType[x['type']] : x.toString()).join(", ")}] => [${repl.map(x => x.toString()).join(", ")}]`);
                    continue outer;
                }
            }
        }
    } while (did_match);
    console.error(`\x1b[1mResult:\x1b[0m [${stream.map(x => x['start'] ? TokenType[x['type']] : x.toString()).join(", ")}]`);
    if (stream.length == 1 && isExpression(stream[0])) {
        stream[0].inferTypes();
        console.error(`\x1b[1mAfter type inference:\x1b[0m [${stream.map(x => x['start'] ? TokenType[x['type']] : x.toString()).join(", ")}]`);
        return stream[0];
    }
    // TODO this should be an error
    return undefined;
}

export abstract class Expression {
    guid: string;
    constructor() {
        this.guid = randomUUID().replace(/-/g, "_");
    }

    abstract toString(): string;
    abstract valueType(): Type;
    isExpression(): boolean { return true; }
    abstract inferTypes(): void;
}

function isExpression(obj: Object): obj is Expression {
    return "isExpression" in obj;
}

interface Specifiable {
    specify(target: Type): Expression
}

function isSpecifiable(obj: Object): obj is Specifiable {
    return "specify" in obj;
}

export class NumericLiteralExpression extends Expression implements Specifiable {
    value: number;
    type: Type;

    constructor(value: number) {
        super();
        this.value = value;
        this.type = new ProviderType([
            TypeRegistry.get("i8"),
            TypeRegistry.get("i32"),
        ]);
    }

    valueType = () => this.type;
    toString = () => `NumericLiteral<${this.valueType().to_readable()}>(${this.value})`;
    specify(target: Type): Expression {
        // TODO check target in this.type
        const rc = new NumericLiteralExpression(this.value);
        rc.type = target;
        return rc;
    }
    inferTypes = () => { };
}

export class LocalDefinitionExpression extends Expression {
    name: string;
    type: Type;

    constructor(name: string, type: Type) {
        super();
        this.name = name;
        this.type = type;
    }

    valueType = () => this.type;
    toString = () => `LocalDefinition<${this.type.to_readable()}>(${this.name})`;
    inferTypes = () => { };
}

export class VariableExpression extends Expression {
    name: string;
    type: Type;

    constructor(name: string, type: Type) {
        super();
        this.name = name;
        this.type = type;
    }

    valueType = () => this.type;
    toString(): string {
        return `Variable<${this.type.to_readable()}>(${this.name})`;
    }
    inferTypes = () => { };
}

export class FieldReferenceExpression extends Expression {
    sub: Expression;
    field: string;
    type: Type;

    constructor(sub: Expression, field: string, type: Type) {
        super();
        this.sub = sub;
        this.field = field;
        this.type = type;
    }

    valueType = () => this.type;
    toString(): string {
        return `FieldReference<${this.type.to_readable()}>(${this.sub.toString()}, ${this.field})`;
    }
    inferTypes = () => {
        InferSubField(this.sub, (n) => this.sub = n);
    }
}

export class AssignmentExpression extends Expression {
    lhs: VariableExpression | FieldReferenceExpression;
    rhs: Expression;

    constructor(lhs: VariableExpression | FieldReferenceExpression, rhs: Expression) {
        super();
        this.lhs = lhs;
        this.rhs = rhs;
    }

    valueType = () => TypeRegistry.get("void");
    toString(): string {
        return `Assignment(${this.lhs.toString()} = ${this.rhs.toString()})`;
    }
    inferTypes = () => {
        InferSubField(this.lhs, (n: VariableExpression | FieldReferenceExpression) => this.lhs = n);
        InferSubField(this.rhs, (n: Expression) => this.rhs = n);
    }
}

export class FunctionCallExpression extends Expression {
    rhs: Expression;
    type: FunctionType;
    args: Expression[];

    constructor(rhs: Expression, type: FunctionType, args: Expression[]) {
        super();
        this.rhs = rhs;
        this.type = type;
        this.args = args;
    }

    valueType = () => this.type.return_type();
    toString = () => `FunctionCall<${this.valueType().to_readable()}>(${this.rhs.toString()}, (${this.args.map(x => x.toString()).join(", ")}))`;
    inferTypes = () => {
        InferSubField(this.rhs, (n: Expression) => this.rhs = n);
        this.args.map((x, i) => InferSubField(x, (n: Expression) => this.args[i] = n));
    }
}

export class SpecifyExpression extends Expression {
    sub: Expression;
    type: Type;

    constructor(sub: Expression, type: Type) {
        super();
        this.sub = sub;
        this.type = type;
    }

    valueType = () => this.type;
    toString = () => `Specify<${this.type.to_readable()}>(${this.sub.toString()})`;
    inferTypes = () => {
        InferSubField(this.sub, (n: Expression) => this.sub = n);
    }
}

type ProductionRule = {
    name: string,
    match: Matcher,
    replace: (input: (Token | Expression)[], scope: Scope) => Expression[];
}

const rules: ProductionRule[] = [
    {
        name: "ConvertNumericLiterals",
        match: Literal("NumericLiteral"),
        replace: (input: [NumericLiteralToken]) => [new NumericLiteralExpression(input[0].value)]
    },
    {
        name: "LocalDefinition",
        match: InOrder(Literal("Let"), Literal("Name"), Literal("Name")),
        replace: (input: [Token, NameToken, NameToken]) => [new LocalDefinitionExpression(input[1].name, TypeRegistry.get(input[2].name))]
    },
    {
        name: "FunctionCall",
        match: InOrder(
            Rvalue(),
            Literal("OpenParen"),
            Optional(
                InOrder(
                    Rvalue(),
                    Star(InOrder(Literal("Comma"), Rvalue()))
                )
            ),
            Literal("CloseParen")),
        replace: (input: [Expression, Token, ...(Token | Expression)[]]) => {
            const rhs = input[0];
            const rest = input.slice(2, input.length - 1);
            const args: Expression[] = [];
            const type = rhs.valueType();
            if (!(type instanceof FunctionType)) return undefined;
            let arg_index = 0;
            for (const exp of rest) {
                // TODO is this correct? I *think* so based on the match invariants, but it's sketchy
                if (isExpression(exp)) {
                    if (isSpecifiable(exp)) {
                        args.push(new SpecifyExpression(exp, type.type_of_argument(arg_index)));
                    } else {
                        args.push(exp);
                    }
                    arg_index++;
                }
            }
            return [new FunctionCallExpression(rhs, type, args)];
        }
    },
    {
        name: "FieldReference",
        match: InOrder(First(Literal("FieldReferenceExpression"), Literal("VariableExpression")), Literal("Period"), Literal("Name")),
        replace: (input: [VariableExpression | FieldReferenceExpression, Token, NameToken]) => {
            let type = input[0].type;
            if (type instanceof ClassType) {
                type = ClassRegistry.get(type.get_name()).lookup_field(input[2].name);
            }
            return [new FieldReferenceExpression(input[0], input[2].name, type)];
        }
    },
    {
        name: "Variable",
        match: Literal("Name"),
        replace: (input: [NameToken], scope: Scope) => {
            if (scope.lookup_symbol(input[0].name)) {
                return [new VariableExpression(
                    input[0].name,
                    scope.lookup_symbol(input[0].name)
                )];
            } else {
                return undefined;
            }
        }
    },
    {
        name: "AssignmentL",
        match: InOrder(Concrete(Lvalue()), Literal("Equals"), Rvalue()),
        replace: (input: [FieldReferenceExpression | VariableExpression, Token, Expression]) => {
            if (isSpecifiable(input[2])) {
                return [new AssignmentExpression(input[0], new SpecifyExpression(input[2], input[0].valueType()))];
            } else {
                return [new AssignmentExpression(input[0], input[2])];
            }
        }
    },
    {
        name: "SpecifyElision",
        match: Literal("SpecifyExpression"),
        replace: (input: [SpecifyExpression]) => {
            if (input[0].sub.valueType().to_readable() == input[0].valueType().to_readable()) {
                return [input[0].sub];
            } else {
                // TODO: error
                return input;
            }
        }
    },
    {
        name: "Specification",
        match: Literal("SpecifyExpression"),
        replace: (input: [SpecifyExpression]) => {
            console.error(`<SPECIFICATION ${input[0]}>`);
            if (!isSpecifiable(input[0].sub)) return undefined;
            return [input[0].sub.specify(input[0].type)];
        }
    }
];

type Matcher = (stream: (Token | Expression)[]) => { matched: boolean, length: number };

function Literal(what: string): Matcher {
    return (stream: (Token | Expression)[]) => {
        if (!stream[0]) return { matched: false, length: 0 };
        if (isExpression(stream[0])) {
            return { matched: stream[0]?.constructor.name == what, length: 1 }
        } else {
            return { matched: TokenType[stream[0].type] == what, length: 1 }
        }
    };
}

function InOrder(...what: Matcher[]): Matcher {
    return (stream: (Token | Expression)[]) => {
        const rc = { matched: true, length: 0 };
        for (const m of what) {
            const rc2 = m(stream.slice(rc.length));
            if (!rc2.matched) return { matched: false, length: 0 };
            rc.length += rc2.length;
        }
        return rc;
    };
}

function First(...what: Matcher[]): Matcher {
    return (stream: (Token | Expression)[]) => {
        for (const m of what) {
            const rc = m(stream);
            if (rc.matched) return rc;
        }
        return { matched: false, length: 0 };
    };
}

function Star(what: Matcher): Matcher {
    return (stream: (Token | Expression)[]) => {
        const rc = { matched: true, length: 0 };
        while (true) {
            const rc2 = what(stream.slice(rc.length));
            if (!rc2.matched) break;
            rc.length += rc2.length;
        }
        return rc;
    };
}

function Optional(what: Matcher): Matcher {
    return (stream: (Token | Expression)[]) => {
        const rc = what(stream);
        if (rc.matched) return rc;
        return { matched: true, length: 0 };
    }
}

function Invert(what: Matcher): Matcher {
    return (stream: (Token | Expression)[]) => {
        const rc = what(stream);
        return { matched: !rc.matched, length: rc.length };
    }
}

// ---

function Lvalue(): Matcher {
    return First(Literal("FieldReferenceExpression"), Literal("VariableExpression"));
}

function Rvalue(): Matcher {
    return First(Lvalue(), Literal("NumericLiteralExpression"));
}

function Concrete(what: Matcher): Matcher {
    return (stream: (Token | Expression)[]) => {
        const rc = what(stream);
        if (!rc.matched) return rc;
        if (rc.length != 1) throw new Error("Attempted to use a type assertion on a multi-subexpression match.");
        if (!isExpression(stream[0])) throw new Error("Attempted to use a type assertion on a token.");
        if (stream[0].valueType().is_concrete()) return rc;
        return { matched: false, length: 0 };
    }
}

class ProviderType implements Type {
    subtypes: Type[];

    constructor(subtypes: Type[]) {
        this.subtypes = subtypes;
    }

    to_ir = () => { throw new Error("Attempted to synthesize a generic type!") };
    to_readable = () => `${this.subtypes.map(x => x.to_readable()).join(" | ")}`;
    is_concrete = () => false;
}

function InferSubField(e: Expression, replace: (n: Expression) => void) {
    if (e instanceof SpecifyExpression) {
        const sub_type = e.sub.valueType();
        if (sub_type.to_readable() == e.valueType().to_readable()) {
            replace(e.sub);
            e = e.sub;
        } else if (isSpecifiable(e.sub)
            && sub_type instanceof ProviderType
            && sub_type.subtypes.some(x => x.to_readable() == e.valueType().to_readable())) {
            replace(e.sub.specify(e.valueType()));
        }
    }
    e.inferTypes();
}