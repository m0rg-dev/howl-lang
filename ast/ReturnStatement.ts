import { Synthesizable } from "../generator";
import { why_not } from "../parser";
import { TokenType } from "../TokenType";
import { NumericLiteral } from "./NumericLiteral";
import { ParsedUnit } from "./ParsedUnit";
import { Terminal } from "./Terminal";

export class ReturnStatement extends ParsedUnit implements Synthesizable {
    expression: NumericLiteral;

    accept(): boolean {
        const keyword = new Terminal(this.source, this.mark);
        if (!keyword.accept_token(TokenType.Return)) return why_not("Expected keyword: return");
        this.accepted(keyword);

        const literal = new NumericLiteral(this.source, this.mark);
        if (!literal.accept()) return why_not("Expected numeric literal");
        this.accepted(literal);

        this.expression = literal;
        this.parts.push(keyword, literal);

        return true;
    }

    synthesize(): string {
        return `    ret i32 ${this.expression.value}`;
    }
}
