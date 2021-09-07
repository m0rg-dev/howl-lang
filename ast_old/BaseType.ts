import { why_not } from '../parser';
import { TokenType } from "../lexer/TokenType";
import { Terminal } from './Terminal';

export class BaseType extends Terminal {
    accept(): boolean {
        if (this.accept_token(TokenType.Int32)) return true;

        const tok = this.next_token();
        return why_not(`Expected a base type, got a ${TokenType[tok.type]}.`);
    }
}
