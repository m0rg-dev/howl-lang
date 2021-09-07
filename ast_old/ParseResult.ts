import { TokenType } from "../lexer/TokenType";
import { Terminal } from "./Terminal";

export class ParseResult {
    ok: boolean;
    where: number;
    why_not: string;
    stack: ParseResult[] = [];

    static Ok(): ParseResult {
        let rc = new ParseResult;
        rc.ok = true;
        return rc;
    }

    static Fail(where: Terminal, why_not: string): ParseResult {
        let rc = new ParseResult;
        rc.ok = false;
        rc.where = where.start;
        rc.why_not = why_not;
        return rc;
    }

    static WrongToken(where: Terminal, expected: TokenType) {
        const tok = where.next_token();
        return this.Fail(where, `Expected a ${TokenType[expected]}, got a ${TokenType[tok.type]}.`)
    }

    append(a: ParseResult): ParseResult {
        this.stack.push(a);
        return this;
    }
}
