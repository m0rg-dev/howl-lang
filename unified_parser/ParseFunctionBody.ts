import { ASTElement, TokenStream } from "./ASTElement";
import { CompoundStatement } from "./CompoundStatement";
import { InOrder, Optional, Literal, Assert, Star, Braces } from "./Matcher";
import { Pass, TypeLiteral, NameExpression, ApplyPass, ArgumentDefinition, ArgumentList } from "./Parser";

export const ParseFunctionBody: Pass = {
    name: "ParseFunctionBody",
    rules: [
        {
            name: "DropKeywords",
            match: InOrder(Optional(Literal("Static")), Literal("Function")),
            replace: () => [],
            startOnly: true
        },
        {
            name: "MatchReturnType",
            match: InOrder(Literal("TypeLiteral"), Literal("NameExpression"), Assert(Literal("OpenParen"))),
            replace: (input: [TypeLiteral, NameExpression], parent: ASTElement) => {
                return [input[0]];
            },
            startOnly: true
        },
        {
            name: "MatchArgumentList",
            match: InOrder(
                Literal("TypeLiteral"),
                Literal("OpenParen"),
                Optional(
                    InOrder(
                        Literal("TypeLiteral"), Literal("NameExpression"),
                        Star(InOrder(Literal("Comma"), Literal("TypeLiteral"), Literal("NameExpression"))),
                        Optional(Literal("Comma")),
                    )
                ),
                Star(Literal("TypeLiteral")),
                Literal("CloseParen")),
            replace: (input: [TypeLiteral, ...TokenStream], parent: ASTElement) => {
                const args = ApplyPass(parent, input.slice(2, input.length - 1), {
                    name: "ConvertArguments",
                    rules: [
                        {
                            name: "ConvertArgument",
                            match: InOrder(Literal("TypeLiteral"), Literal("NameExpression"), Optional(Literal("Comma"))),
                            replace: (input: [TypeLiteral, NameExpression]) => {
                                return [new ArgumentDefinition(parent, input[1].name, input[0].field_type)];
                            }
                        }
                    ]
                });
                return [input[0], new ArgumentList(parent, args as ArgumentDefinition[])];
            },
            startOnly: true
        },
        {
            name: "MatchFunctionBody",
            match: InOrder(Literal("TypeLiteral"), Literal("ArgumentList"), Assert(Literal("OpenBrace")), Braces()),
            replace: (input: [TypeLiteral, ArgumentList, ...TokenStream], parent: ASTElement) => [input[0], input[1], new CompoundStatement(parent, input.slice(2)).parse()],
            startOnly: true
        },
    ]
}
