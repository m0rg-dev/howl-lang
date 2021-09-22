import { ASTElement } from "../../ast/ASTElement";
import { SignatureElement } from "../../ast/SignatureElement";
import { TokenElement } from "../../ast/TokenElement";
import { TypeElement } from "../../ast/TypeElement";
import { Token } from "../../lexer/Token";
import { TokenType } from "../../lexer/TokenType";
import { Hug, InOrder, MatchElementType, MatchToken } from "../Matcher";
import { ApplyPass, LocationFrom, RuleList } from "../Parser";
import { ParseSignature } from "./ParseSignature";

export const ParseClassParts: RuleList = {
    name: "ParseClassParts",
    rules: [
        {
            name: "CreateSignature",
            match: InOrder(
                MatchToken(TokenType.Class),
                MatchElementType("TypeElement"),
                Hug(TokenType.OpenAngle)
            ),
            replace: (ast_stream: [TokenElement<Token>, TypeElement, ...ASTElement[]]) => {
                let rest = ast_stream.slice(3, ast_stream.length - 1);
                let changed: boolean;
                [rest, changed] = ApplyPass(rest, ParseSignature);
                if (!changed) return undefined;
                return [ast_stream[0], ast_stream[1], new SignatureElement(LocationFrom(rest), rest)];
            },
            startOnly: true
        }
    ]
};
