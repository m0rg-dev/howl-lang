import { why_not } from '../parser';
import { NameToken } from "../lexer/NameToken";
import { TokenType } from "../lexer/TokenType";
import { Terminal } from './Terminal';

export class Name extends Terminal {
    name: string;

    accept(): boolean {
        const tok = this.next_token();
        if (tok.type != TokenType.Name) return why_not(`Expected a Name, got a ${TokenType[tok.type]}.`);
        this.name = (tok as NameToken).name;
        this.end = this.start + tok.length;
        this.update_raw();
        return true;
    }

    pretty_print(depth = 0): string {
        return " ".repeat(depth) + `(${this.start}, ${this.end}) Name: ${this.name}`;
    }
}
