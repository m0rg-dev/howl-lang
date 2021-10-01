import { ASTElement } from "../ast/ASTElement";
import { TokenElement } from "../ast/TokenElement";
import { SimpleTypeElement, TypeElement } from "../ast/TypeElement";
import { TokenType } from "../lexer/TokenType";
import { AssertNegative, InOrder, MatchToken, Star } from "../parser/Matcher";
import { LocationFrom } from "../parser/Parser";
import { MatchSingleType, MatchType } from "../parser/MatchUtils";
import { Pass } from "./Pass";

export class ParseTypesPass extends Pass {
    apply() {
        let rc = false;
        do {
            rc = this.ApplyMultipleProductionRules([{
                name: "BaseCase",
                match: InOrder(MatchSingleType(), AssertNegative(MatchToken(TokenType.OpenAngle))),
                replace: (ast_stream: [SimpleTypeElement]) => {
                    return [new TypeElement(ast_stream[0].source_location, ast_stream[0], [])];
                }
            }, {
                name: "ParameterizeType",
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
            }, {
                name: "RawPointer",
                match: InOrder(MatchToken(TokenType.Asterisk), MatchType()),
                replace: (ast_stream: [TokenElement<any>, TypeElement]) => {
                    return [ast_stream[1].asRawPointer()];
                }
            }]);
        } while (rc);
    }
}