import { ASTElement, PartialElement, SourceLocation } from "../ast/ASTElement";
import { CompoundStatementElement } from "../ast/CompoundStatementElement";
import { FunctionElement } from "../ast/FunctionElement";
import { ModuleDefinitionElement } from "../ast/ModuleDefinitionElement";
import { NameElement } from "../ast/NameElement";
import { PartialArgumentListElement } from "../ast/PartialArgumentListElement";
import { PartialClassElement } from "../ast/PartialClassElement";
import { Scope } from "../ast/Scope";
import { SignatureElement } from "../ast/SignatureElement";
import { TokenElement } from "../ast/TokenElement";
import { TypeElement } from "../ast/TypeElement";
import { Token } from "../lexer/Token";
import { TokenType } from "../lexer/TokenType";
import { Functions, PartialFunctions, Types } from "../registry/Registry";
import { Any, AssertNegative, First, InOrder, Matcher, MatchToken, Star } from "./Matcher";
import { FunctionRules } from "./rules/FunctionRules";
import { ParseFunctionParts } from "./rules/ParseFunctionParts";
import { TopLevelParse } from "./rules/TopLevelParse";

export function Parse(token_stream: Token[]): ASTElement[] {
    let ast_stream: ASTElement[] = token_stream.map(x => new TokenElement(x));
    ast_stream = ApplyPass(ast_stream, TopLevelParse)[0];

    for (const el of ast_stream) {
        if (el instanceof PartialClassElement) {
            el.body = ApplyPass(el.body, {
                name: "ExtractMethods",
                rules: [
                    ...FunctionRules
                ]
            })[0];
        }
    }

    ExtractTypeDefinitions(ast_stream);
    ClassifyNames(ast_stream);

    PartialFunctions.forEach(x => {
        x.body = ApplyPass(x.body, ParseFunctionParts)[0];
        if (x.body[0] instanceof TokenElement && x.body[0].token.type == TokenType.Static) {
            // TODO
            x.body.shift();
        }

        if (x.body[0] instanceof TokenElement
            && x.body[1] instanceof NameElement
            && x.body[2] instanceof SignatureElement
            && x.body[3] instanceof PartialArgumentListElement
            && x.body[4] instanceof CompoundStatementElement) {
            const n = new FunctionElement(
                x.source_location,
                x.body[1].name,
                x.body[2],
                x.body[3],
                x.body[4]
            );
            const scope = new Scope(n, n.scope);
            n.body.type.expressions.forEach(x => scope.addType(x));
            n.body.addScope(scope);
            Functions.add(n);
            PartialFunctions.delete(x);
        } else {
            console.error(FormatASTStream(x.body));
        }
    });

    return ast_stream;
}

export function ApplyPass(ast_stream: ASTElement[], rules: RuleList): [ASTElement[], boolean] {
    const s2 = [...ast_stream];
    let changed = false;
    let ever_changed = false;
    console.error(`Pass: ${rules.name}`);
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

function FormatASTStream(ast_stream: ASTElement[]): string {
    return ast_stream.map(x => x.toString()).join(" ");
}

function ExtractTypeDefinitions(ast_stream: ASTElement[]) {
    for (const el of ast_stream) {
        if (el instanceof PartialClassElement) {
            Types.add(el.name);
        } else if (el instanceof ModuleDefinitionElement) {
            Types.add(el.name);
        }
    }
}

function ClassifyNames(ast_stream: ASTElement[]) {
    for (const idx in ast_stream) {
        const el = ast_stream[idx];
        if (el instanceof PartialElement) {
            ClassifyNames(el.body);
        } else if (el instanceof TokenElement && el.token.type == TokenType.Name) {
            if (Types.has(el.token.name)) {
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
