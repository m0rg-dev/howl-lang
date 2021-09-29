import { ASTElement } from "../../ast/ASTElement";
import { NameElement } from "../../ast/NameElement";
import { TokenElement } from "../../ast/TokenElement";
import { SimpleTypeElement, TypeElement } from "../../ast/TypeElement";
import { TokenType } from "../../lexer/TokenType";
import { TypeNames } from "../../registry/Registry";
import { AssertNegative, InOrder, MatchElementType, MatchToken, Star } from "../Matcher";
import { LocationFrom, RuleList } from "../Parser";
import { MatchSingleType, MatchType } from "./MatchUtils";

export const ParseTypes: RuleList = {
    name: "ParseTypes",
    rules: [
        {
            name: "Subtype",
            match: InOrder(MatchSingleType(), MatchToken(TokenType.Period), MatchElementType("NameElement")),
            replace: (ast_stream: [SimpleTypeElement, any, NameElement]) => {
                if (!TypeNames.has(ast_stream[0].name + "." + ast_stream[2].name)) return undefined;
                return [new SimpleTypeElement(LocationFrom(ast_stream), ast_stream[0].name + "." + ast_stream[2].name)];
            }
        },
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
                        MatchType(),
                        Star(
                            InOrder(
                                MatchToken(TokenType.Comma),
                                MatchType()
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
        },
        {
            name: "RawPointer",
            match: InOrder(MatchToken(TokenType.Asterisk), MatchType()),
            replace: (ast_stream: [TokenElement<any>, TypeElement]) => {
                return [ast_stream[1].asRawPointer()];
            }
        },
    ]
};
