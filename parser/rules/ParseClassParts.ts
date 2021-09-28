import { NameElement } from "../../ast/NameElement";
import { TypedItemElement } from "../../ast/TypedItemElement";
import { TypeElement } from "../../ast/TypeElement";
import { TokenType } from "../../lexer/TokenType";
import { InOrder, MatchElementType, MatchToken } from "../Matcher";
import { LocationFrom, RuleList } from "../Parser";

export const ParseClassParts: RuleList = {
    name: "ParseClassParts",
    rules: [
        {
            name: "ParseField",
            match: InOrder(MatchElementType("TypeElement"), MatchElementType("NameElement"), MatchToken(TokenType.Semicolon)),
            replace: (ast_stream: [TypeElement, NameElement]) => {
                return [new TypedItemElement(LocationFrom(ast_stream), ast_stream[1].name, ast_stream[0].asTypeObject())];
            }
        }
    ]
};
