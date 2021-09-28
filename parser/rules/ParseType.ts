import { ASTElement } from "../../ast/ASTElement";
import { SimpleTypeElement, TypeElement } from "../../ast/TypeElement";
import { TokenType } from "../../lexer/TokenType";
import { AssertNegative, InOrder, MatchElementType, MatchToken, Star } from "../Matcher";
import { LocationFrom, RuleList } from "../Parser";
import { MatchSingleType } from "./MatchUtils";

export const ParseTypes: RuleList = {
    name: "ParseTypes",
    rules: [
        {
            name: "BaseCase",
            match: InOrder(MatchSingleType(), AssertNegative(MatchToken(TokenType.OpenAngle))),
            replace: (ast_stream: [SimpleTypeElement]) => {
                return [new TypeElement(ast_stream[0].source_location, ast_stream[0], [])];
            }
        },
        {
            name: "Parameterized",
            match: InOrder(
                MatchSingleType(),
                InOrder(
                    MatchToken(TokenType.OpenAngle),
                    InOrder(
                        MatchElementType("TypeElement"),
                        Star(
                            InOrder(
                                MatchToken(TokenType.Comma),
                                MatchElementType("TypeElement")
                            )
                        )
                    ),
                    MatchToken(TokenType.CloseAngle)
                )
            ),
            replace: (ast_stream: [SimpleTypeElement, ...ASTElement[]]) => {
                return [new TypeElement(LocationFrom(ast_stream), ast_stream[0],
                    ast_stream.slice(1).filter(x => x instanceof TypeElement) as TypeElement[])];
            }
        }
    ]
};
