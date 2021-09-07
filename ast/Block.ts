import { Synthesizable } from "../generator";
import { TokenType } from "../TokenType";
import { ParsedUnit } from "./ParsedUnit";
import { ParseResult } from "./ParseResult";
import { Statement } from "./Statement";
import { Terminal } from "./Terminal";

export class Block extends ParsedUnit implements Synthesizable {
    statements: Statement[] = [];

    accept(): ParseResult {
        const open = new Terminal(this.source, this.mark);
        if (!open.accept_token(TokenType.OpenBrace))
            return ParseResult.WrongToken(this, TokenType.OpenBrace);
        this.accepted(open);

        const statements: Statement[] = [];
        let close: Terminal;
        while (this.mark <= this.source.length) {
            close = new Terminal(this.source, this.mark);
            if (close.accept_token(TokenType.CloseBrace)) {
                this.accepted(close);
                break;
            } else {
                const s = new Statement(this.source, this.mark);
                const err = s.accept();
                if(!err.ok) return err.append(ParseResult.Fail(this, "Expected statement or closing brace"));
                this.accepted(s);
                statements.push(s);
            }
        }

        this.statements = statements;

        this.parts.push(open, close);
        return ParseResult.Ok();
    }

    synthesize(): string {
        return this.statements.map(x => x.synthesize()).join("\n");
    }
}