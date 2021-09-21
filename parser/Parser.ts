import { ASTElement, PartialElement, SourceLocation } from "../ast/ASTElement";
import { CompoundStatementElement } from "../ast/CompoundStatementElement";
import { ModuleDefinitionElement } from "../ast/ModuleDefinitionElement";
import { NameElement } from "../ast/NameElement";
import { PartialArgumentListElement } from "../ast/PartialArgumentListElement";
import { PartialClassElement } from "../ast/PartialClassElement";
import { PartialCompoundStatementElement } from "../ast/PartialCompoundStatementElement";
import { PartialFunctionElement } from "../ast/PartialFunctionElement";
import { PartialSimpleStatementElement } from "../ast/PartialSimpleStatementElement";
import { SignatureElement } from "../ast/SignatureElement";
import { SyntaxErrorElement } from "../ast/SyntaxErrorElement";
import { TokenElement } from "../ast/TokenElement";
import { TypeElement } from "../ast/TypeElement";
import { TypeExpressionElement, TypeIndexElement, TypeLiteralElement } from "../ast/TypeExpressionElement";
import { NameToken } from "../lexer/NameToken";
import { NumericLiteralToken } from "../lexer/NumericLiteralToken";
import { Token } from "../lexer/Token";
import { TokenType } from "../lexer/TokenType";
import { PartialFunctions, Types } from "../registry/Registry";
import { Any, AssertEnd, AssertNegative, First, Hug, InOrder, MatchElementType, Matcher, MatchToken, Optional, Star, Until } from "./Matcher";

export function Parse(token_stream: Token[]) {
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
    });
}

export function ApplyPass(ast_stream: ASTElement[], rules: RuleList): [ASTElement[], boolean] {
    const s2 = [...ast_stream];
    let changed = false;
    let ever_changed = false;
    console.error(`Pass: ${rules.name}`);
    do {
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

export const ModuleRules: ProductionRule[] = [
    {
        name: "ModuleConstruct",
        match: InOrder(
            MatchToken(TokenType.Module),
            MatchToken(TokenType.Name),
            MatchToken(TokenType.Semicolon)
        ),
        replace: (ast_stream: [any, TokenElement<NameToken>, any]) => {
            return [new ModuleDefinitionElement(LocationFrom(ast_stream), ast_stream[1].token.name)];
        }
    },
    {
        name: "ModuleMissingSemicolon",
        match: InOrder(
            MatchToken(TokenType.Module),
            MatchToken(TokenType.Name),
            AssertNegative(MatchToken(TokenType.Semicolon)),
            Any(),
            ResynchronizeTopLevel
        ),
        replace: (ast_stream: [any, TokenElement<NameToken>, ASTElement]) => {
            return [new SyntaxErrorElement(LocationFrom(ast_stream),
                `Expected semicolon after 'module ${ast_stream[1].token.name}', found ${ast_stream[2]}`
            )];
        }
    },
    {
        name: "ModuleMissingName",
        match: InOrder(
            MatchToken(TokenType.Module),
            AssertNegative(MatchToken(TokenType.Name)),
            Any(),
            ResynchronizeTopLevel
        ),
        replace: (ast_stream: [any, ASTElement]) => {
            return [new SyntaxErrorElement(LocationFrom(ast_stream),
                `Expected name after 'module', found ${ast_stream[1]}`
            )];
        }
    }
];

export const ClassRules: ProductionRule[] = [
    {
        name: "ClassConstruct",
        match: InOrder(
            MatchToken(TokenType.Class),
            MatchToken(TokenType.Name),
            Hug(TokenType.OpenAngle),
            Hug(TokenType.OpenBrace)
        ),
        replace: (ast_stream: [any, TokenElement<NameToken>, ...ASTElement[]]) => {
            return [new PartialClassElement(LocationFrom(ast_stream), ast_stream, ast_stream[1].token.name)];
        }
    },
    {
        name: "ClassMissingBody",
        match: InOrder(
            MatchToken(TokenType.Class),
            MatchToken(TokenType.Name),
            Hug(TokenType.OpenAngle),
            AssertNegative(Hug(TokenType.OpenBrace)),
            ResynchronizeTopLevel
        ),
        replace: (ast_stream: [any, TokenElement<NameToken>, ...ASTElement[]]) => {
            return [new SyntaxErrorElement(LocationFrom(ast_stream),
                `Failed to parse class body for ${ast_stream[1].token.name} (check bracket matching)`
            )];
        }
    },
    {
        name: "ClassMissingTypes",
        match: InOrder(
            MatchToken(TokenType.Class),
            MatchToken(TokenType.Name),
            AssertNegative(Hug(TokenType.OpenAngle)),
            ResynchronizeTopLevel
        ),
        replace: (ast_stream: [any, TokenElement<NameToken>, ...ASTElement[]]) => {
            return [new SyntaxErrorElement(LocationFrom(ast_stream),
                `Failed to parse class types for ${ast_stream[1].token.name} (check bracket matching)`
            )]
        }
    }
];

export const FunctionRules: ProductionRule[] = [
    {
        name: "FunctionConstruct",
        match: InOrder(
            Optional(MatchToken(TokenType.Static)),
            MatchToken(TokenType.Function),
            MatchToken(TokenType.Name),
            Hug(TokenType.OpenAngle),
            Hug(TokenType.OpenParen),
            Hug(TokenType.OpenAngle),
            Hug(TokenType.OpenBrace)
        ),
        replace: (ast_stream: ASTElement[]) => {
            let name: string;
            if (ast_stream[1] instanceof TokenElement
                && ast_stream[1].token.type == TokenType.Name) {
                name = ast_stream[1].token.name;
            } else if (ast_stream[2] instanceof TokenElement
                && ast_stream[2].token.type == TokenType.Name) {
                name = ast_stream[2].token.name;
            } else {
                return undefined;
            }
            return [new PartialFunctionElement(LocationFrom(ast_stream), ast_stream, name)];
        }
    }
];

export const TopLevelParse: RuleList = {
    name: "TopLevelParse",
    rules: [
        ...ModuleRules,
        ...ClassRules,
        ...FunctionRules,
    ]
};

export const ParseFunctionParts: RuleList = {
    name: "ParseFunctionParts",
    rules: [
        {
            name: "CreateSignature",
            match: InOrder(
                MatchToken(TokenType.Function),
                MatchElementType("NameElement"),
                Hug(TokenType.OpenAngle)
            ),
            replace: (ast_stream: [TokenElement<Token>, NameElement, ...ASTElement[]]) => {
                let rest = ast_stream.slice(3, ast_stream.length - 1);
                let changed: boolean;
                [rest, changed] = ApplyPass(rest, ParseSignature);
                if (!changed) return undefined;
                return [ast_stream[0], ast_stream[1], new SignatureElement(LocationFrom(rest), rest)];
            }
        },
        {
            name: "SplitArguments",
            match: InOrder(
                MatchToken(TokenType.Function),
                MatchElementType("NameElement"),
                MatchElementType("SignatureElement"),
                Hug(TokenType.OpenParen)
            ),
            replace: (ast_stream: [TokenElement<Token>, NameElement, SignatureElement, ...ASTElement[]]) => {
                let rest = ast_stream.slice(4, ast_stream.length - 1);
                return [...ast_stream.slice(0, 3), new PartialArgumentListElement(LocationFrom(rest), rest)];
            }
        },
        {
            name: "SplitBody",
            match: InOrder(
                MatchToken(TokenType.Function),
                MatchElementType("NameElement"),
                MatchElementType("SignatureElement"),
                MatchElementType("PartialArgumentListElement"),
                Hug(TokenType.OpenAngle),
                Hug(TokenType.OpenBrace)
            ),
            replace: (ast_stream: [TokenElement<Token>, NameElement, SignatureElement, PartialArgumentListElement, ...ASTElement[]]) => {
                return [...ast_stream.slice(0, 4), new PartialCompoundStatementElement(LocationFrom(ast_stream.slice(4)), ast_stream.slice(4))];
            }
        },
        {
            name: "ParseBody",
            match: MatchElementType("PartialCompoundStatementElement"),
            replace: (ast_stream: [PartialCompoundStatementElement]) => {
                const [rc, changed] = ApplyPass(ast_stream[0].body, ParseCompoundStatement);
                if (!changed) return undefined;

                if (!(rc[0] instanceof SignatureElement)) return undefined;

                return [new CompoundStatementElement(LocationFrom(ast_stream), rc[0], rc.slice(1))];
            }
        }
    ]
}

export const ParseSignature: RuleList = {
    name: "ParseSignature",
    rules: [
        {
            name: "ExtractExpression",
            match: InOrder(
                AssertNegative((a: ASTElement[]) => {
                    if (a[0] instanceof TypeExpressionElement) return [true, 1];
                    return [false, 0];
                }),
                Until(First(MatchToken(TokenType.Comma), AssertEnd()))
            ),
            replace: (ast_stream: ASTElement[]) => {
                const [rc, changed] = ApplyPass(ast_stream, ParseTypeExpression);
                if (!changed) return undefined;
                return rc;
            }
        },
        {
            name: "DropCommas",
            match: InOrder(
                (a: ASTElement[]) => {
                    if (a[0] instanceof TypeExpressionElement) return [true, 1];
                    return [false, 0];
                },
                MatchToken(TokenType.Comma)
            ),
            replace: (ast_stream: [TypeExpressionElement, TokenElement<Token>]) => {
                return [ast_stream[0]];
            }
        }
    ]
}

export const ParseTypeExpression: RuleList = {
    name: "ParseTypeExpression",
    rules: [
        {
            name: "ConvertLiterals",
            match: MatchElementType("TypeElement"),
            replace: (ast_stream: [TypeElement]) => {
                return [new TypeLiteralElement(ast_stream[0].source_location, ast_stream[0].name)];
            }
        },
        {
            name: "Index",
            match: InOrder(
                MatchToken(TokenType.NumericLiteral),
                MatchToken(TokenType.OpenBracket),
                MatchToken(TokenType.NumericLiteral),
                MatchToken(TokenType.CloseBracket)
            ),
            replace: (ast_stream: [TokenElement<NumericLiteralToken>, TokenElement<Token>, TokenElement<NumericLiteralToken>, TokenElement<Token>]) => {
                return [
                    new TypeIndexElement(LocationFrom(ast_stream), ast_stream[0].token.value, ast_stream[2].token.value)
                ];
            }
        }
    ]
}

export const ParseCompoundStatement: RuleList = {
    name: "ParseCompoundStatement",
    rules: [
        {
            name: "CreateSignature",
            match: Hug(TokenType.OpenAngle),
            replace: (ast_stream: ASTElement[]) => {
                let changed: boolean;
                [ast_stream, changed] = ApplyPass(ast_stream.slice(1, -1), ParseSignature);
                return [new SignatureElement(LocationFrom(ast_stream), ast_stream)];
            },
            startOnly: true
        },
        {
            name: "DropBraces",
            match: InOrder(
                MatchElementType("SignatureElement"),
                Hug(TokenType.OpenBrace)
            ),
            replace: (ast_stream: [SignatureElement, ...ASTElement[]]) => {
                return [ast_stream[0], ...ast_stream.slice(2, -1)];
            },
            startOnly: true
        },
        {
            name: "ExtractSimpleStatement",
            match: InOrder(
                AssertNegative(MatchElementType("SignatureElement")),
                Until(MatchToken(TokenType.Semicolon)),
                MatchToken(TokenType.Semicolon)
            ),
            replace: (ast_stream: ASTElement[]) => {
                return [new PartialSimpleStatementElement(LocationFrom(ast_stream), ast_stream.slice(0, -1))];
            }
        }
    ]
}