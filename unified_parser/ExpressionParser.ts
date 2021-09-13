import { Scope } from "../ast/Scope";
import { ClassRegistry, ClassType, FunctionType, PointerType, StaticFunctionRegistry, Type, TypeRegistry } from "../generator/TypeRegistry";
import { NameToken } from "../lexer/NameToken";
import { NumericLiteralToken } from "../lexer/NumericLiteralToken";
import { Token } from "../lexer/Token";
import { TokenType } from "../lexer/TokenType";
import { AssignmentExpression } from "../expression/AssignmentExpression";
import { DereferenceExpression } from "../expression/DereferenceExpression";
import { isAstElement } from "./ASTElement";
import { Expression } from "../expression/Expression";
import { FieldReferenceExpression, MethodReferenceExpression } from "../expression/FieldReferenceExpression";
import { FunctionCallExpression } from "../expression/FunctionCallExpression";
import { LocalDefinitionExpression } from "../expression/LocalDefinitionExpression";
import { NumericLiteralExpression } from "../expression/NumericLiteralExpression";
import { ReturnExpression } from "../expression/ReturnExpression";
import { VariableExpression } from "../expression/VariableExpression";
import { isSpecifiable } from "../expression/Specifiable";
import { StaticFunctionReferenceExpression } from "../expression/StaticFunctionReferenceExpression";
import { StaticFunctionCallExpression } from "../expression/StaticFunctionCallExpression";
import { SpecifyExpression } from "../expression/SpecifyExpression";
import { VoidExpression } from "../expression/VoidExpression";
import { Matcher, Literal, InOrder, Optional, Star, First } from "./Matcher";

export function parseExpression(input_stream: Token[], scope: Scope): Expression {
    console.error("Entered expression parser.");
    console.error(`Token stream: [${input_stream.map(x => TokenType[x.type]).join(", ")}]`);

    const stream: (Token | Expression)[] = [...input_stream];
    let did_match = false;
    outer: do {
        did_match = false;
        for (const rule of rules) {
            let ptr = 0;
            inner: for (ptr = 0; ptr < stream.length; ptr++) {
                const m = rule.match(stream.slice(ptr));
                if (m.matched) {
                    console.error(`Applied rule ${rule.name}`);
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
    if (stream.length == 1 && isAstElement(stream[0])) {
        stream[0].inferTypes();
        console.error(`\x1b[1mAfter type inference:\x1b[0m [${stream.map(x => x['start'] ? TokenType[x['type']] : x.toString()).join(", ")}]`);
        return stream[0];
    }
    // TODO this should be an error
    return undefined;
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
            let type = rhs.valueType();
            let function_type: FunctionType;
            if (type instanceof PointerType) {
                if (!(type.get_sub() instanceof FunctionType)) return undefined;
                function_type = type.get_sub() as FunctionType;
            } else if (type instanceof FunctionType) {
                function_type = type;
            } else {
                return undefined;
            }
            let arg_index = 0;
            if(input[0] instanceof MethodReferenceExpression) {
                args.push(input[0].self);
                arg_index++;
            }
            for (const exp of rest) {
                // TODO is this correct? I *think* so based on the match invariants, but it's sketchy
                if (isAstElement(exp)) {
                    args.push(new SpecifyExpression(exp, function_type.type_of_argument(arg_index)));
                    arg_index++;
                }
            }
            if (input[0] instanceof StaticFunctionReferenceExpression) {
                return [new StaticFunctionCallExpression(input[0].name, (type as FunctionType), args)];
            } else {
                return [new FunctionCallExpression(rhs, (type as PointerType), args)];
            }
        }
    },
    {
        name: "MethodReference",
        match: InOrder(Lvalue(), Literal("Period"), Literal("Name")),
        replace: (input: [VariableExpression | FieldReferenceExpression, Token, NameToken]) => {
            const type = input[0].type;
            if (type instanceof PointerType
                && type.get_sub() instanceof ClassType) {
                const class_type = type.get_sub() as ClassType;
                const stable = ClassRegistry.get(`__${class_type.get_name()}_static`);
                if (!stable) return undefined;

                const subtype = stable.lookup_field(input[2].name);
                if (!subtype) return undefined;
                return [
                    new MethodReferenceExpression(
                        new DereferenceExpression(
                            new FieldReferenceExpression(new DereferenceExpression(input[0]), "__stable", new PointerType(new ClassType(`__${class_type.get_name()}_static`))),
                        ),
                        input[2].name,
                        subtype.type,
                        input[0]
                    )
                ];
            } else {
                return undefined;
            }
        }
    },
    {
        name: "FieldReference",
        match: InOrder(Lvalue(), Literal("Period"), Literal("Name")),
        replace: (input: [VariableExpression | FieldReferenceExpression, Token, NameToken]) => {
            const type = input[0].type;
            if (type instanceof ClassType) {
                const field_type = ClassRegistry.get(type.get_name()).lookup_field(input[2].name).type;
                return [new FieldReferenceExpression(input[0], input[2].name, field_type)];
            } else if (type instanceof PointerType
                && type.get_sub() instanceof ClassType) {
                const class_type = type.get_sub() as ClassType;
                const class_obj = ClassRegistry.get(class_type.get_name());
                const field_type = class_obj.lookup_field(input[2].name)?.type;
                if (!field_type) {
                    throw new Error(`Couldn't get field ${input[2].name} on (dereferenced) ${class_obj.name}`);
                }
                return [new FieldReferenceExpression(new DereferenceExpression(input[0]), input[2].name, field_type)];
            } else {
                return undefined;
            }
        }
    },
    {
        name: "Variable",
        match: Literal("Name"),
        replace: (input: [NameToken], scope: Scope) => {
            const sym = scope.lookup_symbol(input[0].name);
            if (sym instanceof FunctionType && StaticFunctionRegistry.has(input[0].name)) {
                return [new StaticFunctionReferenceExpression(
                    input[0].name,
                    sym
                )];
            } else if (sym) {
                return [new VariableExpression(
                    input[0].name,
                    sym
                )];
            } else {
                return undefined;
            }
        }
    },
    {
        name: "AssignmentL",
        match: InOrder(Concrete(Lvalue()), Literal("Equals"), Rvalue()),
        replace: (input: [FieldReferenceExpression | VariableExpression, Token, Expression]) => [
            new AssignmentExpression(input[0], new SpecifyExpression(input[2], input[0].valueType()))
        ]
    },
    {
        name: "ReturnValue",
        match: InOrder(Literal("Return"), Rvalue()),
        replace: (input: [Token, Expression], scope: Scope) => [
            new ReturnExpression(new SpecifyExpression(input[1], scope.current_return()))
        ]
    },
    {
        name: "ReturnVoid",
        match: Literal("Return"),
        replace: (input: [Token], scope: Scope) => {
            console.error(`current_return = ${scope.current_return().to_readable()}`);
            if (scope.current_return().to_readable() != "void") return undefined;
            return [new ReturnExpression(new VoidExpression())];
        }
    }
];

// ---

function Lvalue(): Matcher {
    return First(
        Literal("FieldReferenceExpression"),
        Literal("MethodReferenceExpression"),
        Literal("StaticReferenceExpression"),
        Literal("VariableExpression"));
}

function Rvalue(): Matcher {
    return First(Lvalue(),
        Literal("NumericLiteralExpression"),
        Literal("FunctionCallExpression"),
        Literal("StaticFunctionReferenceExpression"),
        Literal("StaticFunctionCallExpression"));
}

function Concrete(what: Matcher): Matcher {
    return (stream: (Token | Expression)[]) => {
        const rc = what(stream);
        if (!rc.matched) return rc;
        if (rc.length != 1) throw new Error("Attempted to use a type assertion on a multi-subexpression match.");
        if (!isAstElement(stream[0])) throw new Error("Attempted to use a type assertion on a token.");
        if (stream[0].valueType().is_concrete()) return rc;
        return { matched: false, length: 0 };
    }
}

export class ProviderType implements Type {
    subtypes: Type[];

    constructor(subtypes: Type[]) {
        this.subtypes = subtypes;
    }

    to_ir = () => { throw new Error("Attempted to synthesize a generic type!") };
    to_readable = () => `${this.subtypes.map(x => x.to_readable()).join(" | ")}`;
    is_concrete = () => false;
}

export function InferSubField(e: Expression, replace: (n: Expression) => void) {
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