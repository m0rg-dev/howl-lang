import { ASTElement, PartialElement, SourceLocation } from "../ast/ASTElement";
import { ClassElement } from "../ast/ClassElement";
import { FunctionElement } from "../ast/FunctionElement";
import { GenericElement } from "../ast/GenericElement";
import { ModuleDefinitionElement } from "../ast/ModuleDefinitionElement";
import { NameElement } from "../ast/NameElement";
import { PartialClassElement } from "../ast/PartialClassElement";
import { PartialFunctionElement } from "../ast/PartialFunctionElement";
import { TokenElement } from "../ast/TokenElement";
import { TypedItemElement } from "../ast/TypedItemElement";
import { TypeElement } from "../ast/TypeElement";
import { Token } from "../lexer/Token";
import { TokenType } from "../lexer/TokenType";
import { Classes, Functions, PartialFunctions, TypeNames } from "../registry/Registry";
import { ClassType, UnitType } from "../type_inference/Type";
import { Any, AssertNegative, First, InOrder, Matcher, MatchToken, Star } from "./Matcher";
import { FunctionRules } from "./rules/FunctionRules";
import { ParseClassParts } from "./rules/ParseClassParts";
import { TopLevelParse } from "./rules/TopLevelParse";

export function Parse(token_stream: Token[]): ASTElement[] {
    let ast_stream: ASTElement[] = token_stream.map(x => new TokenElement(x));
    ast_stream = ApplyPass(ast_stream, TopLevelParse)[0];

    ExtractTypeDefinitions(ast_stream);

    for (const el of ast_stream) {
        if (el instanceof PartialClassElement) {
            console.error("~~~ Parsing class: " + el.toString() + " ~~~");
            el.body = ApplyPass(el.body, {
                name: "ParseMethods",
                rules: FunctionRules(el.name)
            })[0];
            ClassifyNames(el.body, new Set(el.generics));
            el.body = ApplyPass(el.body, ParseClassParts)[0];

            const fields: TypedItemElement[] = [];
            const methods: FunctionElement[] = [];

            for (const sub of el.body) {
                if (sub instanceof TypedItemElement) {
                    fields.push(sub);
                }
            }

            const ce = new ClassElement(
                el.source_location,
                el.name,
                fields,
                [],
                el.generics
            )

            Classes.set(el.name, ce);

            for (const sub of el.body) {
                if (sub instanceof PartialFunctionElement) {
                    const n = sub.parse(new ClassType(el.name));
                    if (n) {
                        methods.push(n);
                    } else {
                        console.error("(method didn't parse) " + FormatASTStream(sub.body));
                    }
                    PartialFunctions.delete(sub);
                }
            }

            ce.methods = methods;
        }
    }

    PartialFunctions.forEach(x => {
        const n = x.parse(new UnitType("void"));
        if (n) {
            Functions.add(n);
            PartialFunctions.delete(x);
        } else {
            console.error("(function didn't parse) " + FormatASTStream(x.body));
        }
    });

    return ast_stream;
}

export function ApplyPass(ast_stream: ASTElement[], rules: RuleList): [ASTElement[], boolean] {
    const s2 = [...ast_stream];
    let changed = false;
    let ever_changed = false;
    console.error(`Pass: ${rules.name} ${FormatASTStream(ast_stream)}`);
    outer: do {
        changed = false;
        let idx = 0;
        while (idx < s2.length) {
            for (const rule of rules.rules) {
                if (idx > 0 && rule.startOnly) continue;
                const [matched, length] = rule.match(s2.slice(idx));
                if (matched) {
                    const repl = rule.replace(s2.slice(idx, idx + length));
                    if (repl) {
                        console.error(`[${rules.name} ${rule.name}] [${s2.slice(idx, idx + length).map(x => x.toString()).join(" ")}] => [${repl.map(x => x.toString()).join(" ")}]`);
                        s2.splice(idx, length, ...repl);
                        changed = ever_changed = true;
                        continue outer;
                    }
                }
            }
            idx++;
        }
    } while (changed);
    return [s2, ever_changed];
}

export function FormatASTStream(ast_stream: ASTElement[]): string {
    return ast_stream.map(x => x.toString()).join(" ");
}

function ExtractTypeDefinitions(ast_stream: ASTElement[]) {
    for (const el of ast_stream) {
        if (el instanceof PartialClassElement) {
            TypeNames.add(el.name);
        } else if (el instanceof ModuleDefinitionElement) {
            TypeNames.add(el.name);
        }
    }
}

export function ClassifyNames(ast_stream: ASTElement[], generics?: Set<string>) {
    if (generics) console.error(`Generics: ${[...generics].join(", ")}`);
    for (const idx in ast_stream) {
        const el = ast_stream[idx];
        if (el instanceof PartialElement) {
            ClassifyNames(el.body, generics);
        } else if (el instanceof TokenElement && el.token.type == TokenType.Name) {
            if (generics?.has(el.token.name)) {
                ast_stream[idx] = new GenericElement(el.source_location, el.token.name);
            } else if (TypeNames.has(el.token.name)) {
                ast_stream[idx] = new TypeElement(el.source_location, el.token.name);
            } else {
                ast_stream[idx] = new NameElement(el.source_location, el.token.name);
            }
        }
    }
    console.error(`After name classification: [${FormatASTStream(ast_stream)}]`);
}

export function LocationFrom(ast_stream: ASTElement[]): SourceLocation {
    if (!ast_stream.length) return [0, 0];
    return [ast_stream[0].source_location[0], ast_stream[ast_stream.length - 1].source_location[1]];
}

export type ProductionRule = {
    name: string;
    match: Matcher;
    replace: (ast_stream: ASTElement[]) => ASTElement[];
    startOnly?: boolean;
};

export type RuleList = {
    name: string;
    rules: ProductionRule[];
};

export const ResynchronizeTopLevel: Matcher = InOrder(
    Star(InOrder(AssertNegative(
        First(
            MatchToken(TokenType.Class),
            MatchToken(TokenType.Function),
            MatchToken(TokenType.Static),
        )
    ), Any()))
);