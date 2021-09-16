import { TokenType } from "../lexer/TokenType";
import { ASTElement, TokenStream } from "./ASTElement";
import { Assert, Braces, First, InOrder, Literal, Optional } from "./Matcher";
import { NameExpression, PartialFunctionConstruct } from "./Parser";

export const MatchFunctionDefinitions = {
    name: "FunctionConstruct",
    match: InOrder(
        Optional(Literal("Static")),
        Literal("Function"),
        Literal("TypeLiteral"),
        Literal("NameExpression"),
        Assert(Literal("OpenParen")),
        Braces(),
        First(
            InOrder(
                Assert(Literal("OpenBrace")),
                Braces()
            ),
            Literal("Semicolon")
        )),
    replace: (input: TokenStream, parent: ASTElement) => {
        let idx = 0;
        while (!(Literal("OpenParen")(input.slice(idx)).matched))
            idx++;
        return [new PartialFunctionConstruct(parent, (input[idx - 1] as NameExpression).name, input).parse(input[0]['type'] == TokenType.Static)];
    }
};
