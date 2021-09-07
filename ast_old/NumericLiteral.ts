import { why_not } from '../parser';
import { NumericLiteralToken } from "../lexer/NumericLiteralToken";
import { TokenType } from "../lexer/TokenType";
import { Terminal } from './Terminal';

export class NumericLiteral extends Terminal {
    value: number;

    accept(): boolean {
        const tok = this.next_token();
        if (tok.type != TokenType.NumericLiteral) return why_not(`Expected a NumericLiteral, got a ${TokenType[tok.type]}.`);
        this.value = (tok as NumericLiteralToken).value;
        this.end = this.start + tok.length;
        this.update_raw();
        return true;
    }

    pretty_print(depth = 0): string {
        return " ".repeat(depth) + `(${this.start}, ${this.end}) NumericLiteral: ${this.value}`;
    }
}
