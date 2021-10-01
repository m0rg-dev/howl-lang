import { ASTElement } from "../../ast/ASTElement";
import { CompoundStatementElement } from "../../ast/CompoundStatementElement";
import { NameElement } from "../../ast/NameElement";
import { PartialArgumentListElement } from "../../ast/PartialArgumentListElement";
import { PartialCompoundStatementElement } from "../../ast/PartialCompoundStatementElement";
import { SignatureElement } from "../../ast/SignatureElement";
import { TokenElement } from "../../ast/TokenElement";
import { Token } from "../../lexer/Token";
import { TokenType } from "../../lexer/TokenType";
import { First, Hug, InOrder, MatchElementType, MatchToken } from "../Matcher";
import { ApplyPass, LocationFrom, RuleList } from "../Parser";
import { MatchType } from "./MatchUtils";
import { ParseCompoundStatement } from "./ParseCompoundStatement";

export const ParseFunctionParts: RuleList = {
    name: "ParseFunctionParts",
    rules: [
        {
            name: "SplitArguments",
            match: InOrder(
                MatchToken(TokenType.Function),
                First(MatchType(), MatchElementType("NameElement")),
                MatchElementType("NameElement"),
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
                First(MatchType(), MatchElementType("NameElement")),
                MatchElementType("NameElement"),
                MatchElementType("PartialArgumentListElement"),
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

                return [/* new CompoundStatementElement(LocationFrom(ast_stream), rc, undefined) */];
            }
        }
    ]
};
