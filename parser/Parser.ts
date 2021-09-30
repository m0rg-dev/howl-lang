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
import { SimpleTypeElement } from "../ast/TypeElement";
import { Token } from "../lexer/Token";
import { TokenType } from "../lexer/TokenType";
import { Classes, CurrentModule, Functions, PartialFunctions, SetCurrentModule, TypeNames } from "../registry/Registry";
import { VoidType } from "../type_inference/VoidType";
import { Any, AssertNegative, First, InOrder, Matcher, MatchToken, Star } from "./Matcher";
import { FunctionRules } from "./rules/FunctionRules";
import { ModuleRules } from "./rules/ModuleRules";
import { ParseClassParts } from "./rules/ParseClassParts";
import { ParseTypes } from "./rules/ParseType";
import { TopLevelParse } from "./rules/TopLevelParse";

export function Parse(token_stream: Token[]): ASTElement[] {
    console.error(TypeNames);
    let ast_stream: ASTElement[] = token_stream.map(x => new TokenElement(x));
    // TODO

    ast_stream = ApplyPass(ast_stream, {
        name: "GetModule",
        rules: ModuleRules
    })[0];

    if (!(ast_stream[0] instanceof ModuleDefinitionElement)) {
        throw new Error("file needs to start with a module definition");
    }

    SetCurrentModule(ast_stream[0].getFQN());
    ast_stream = ApplyPass(ast_stream, TopLevelParse(ast_stream[0]))[0];

    ExtractTypeDefinitions(ast_stream);

    for (const el of ast_stream) {
        if (el instanceof PartialClassElement) {
            console.error("~~~ Parsing class: " + el.toString() + " ~~~");
            el.body = ApplyPass(el.body, {
                name: "ParseMethods",
                rules: FunctionRules(undefined)
            })[0];
            ClassifyNames(el.body, new Set(el.generics));
            el.body = ApplyPass(el.body, ParseTypes)[0];
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
                el.parent as ModuleDefinitionElement,
                el.name,
                fields,
                [],
                el.generics
            )

            console.error(` Registering class: ${ce.getFQN()}`);
            Classes.set(ce.getFQN().toString(), ce);

            for (const sub of el.body) {
                if (sub instanceof PartialFunctionElement) {
                    const n = sub.parse();
                    if (n) {
                        n.setParent(ce);
                        methods.push(n);
                    } else {
                        console.error("(method didn't parse) " + FormatASTStream(sub.body));
                    }
                    PartialFunctions.delete(sub);
                }
            }

            ce.methods = methods;
            methods.forEach((m) => m.self_type = ce.type());
        }
    }

    PartialFunctions.forEach(x => {
        const n = x.parse();
        if (n) {
            n.self_type = new VoidType();
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
        if (el instanceof PartialClassElement || el instanceof ModuleDefinitionElement) {
            console.error(`  Extracted type: ${el.getFQN()}`);
            TypeNames.add(el.getFQN().toString());
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
                ast_stream[idx] = new SimpleTypeElement(el.source_location, el.token.name);
            } else if (TypeNames.has(CurrentModule.toString() + "." + el.token.name)) {
                ast_stream[idx] = new SimpleTypeElement(el.source_location, CurrentModule.toString() + "." + el.token.name);
            } else {
                ast_stream[idx] = new NameElement(el.source_location, el.token.name);
            }
        } else if (el instanceof NameElement) {
            if (TypeNames.has(el.name)) {
                ast_stream[idx] = new SimpleTypeElement(el.source_location, el.name);
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
