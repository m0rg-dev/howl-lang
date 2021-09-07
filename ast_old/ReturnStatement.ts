import { Synthesizable } from "../generator";
import { why_not } from "../parser";
import { TokenType } from "../lexer/TokenType";
import { NumericLiteral } from "./NumericLiteral";
import { ParsedUnit } from "./ParsedUnit";
import { ParseResult } from "./ParseResult";
import { Terminal } from "./Terminal";

export class ReturnStatement extends ParsedUnit implements Synthesizable {
    expression: NumericLiteral;

    accept(): ParseResult {
        const keyword = new Terminal(this.source, this.mark);
        if (!keyword.accept_token(TokenType.Return)) return ParseResult.WrongToken(this, TokenType.Return);
        this.accepted(keyword);

        const literal = new NumericLiteral(this.source, this.mark);
        if (!literal.accept()) return ParseResult.WrongToken(this, TokenType.NumericLiteral);
        this.accepted(literal);

        this.expression = literal;
        this.parts.push(keyword, literal);

        return ParseResult.Ok();
    }

    synthesize(): string {
        return `    ret i32 ${this.expression.value}`;
    }
}
