import { Synthesizable } from "../generator";
import { why_not } from "../parser";
import { TokenType } from "../TokenType";
import { ParsedUnit } from "./ParsedUnit";
import { Statement } from "./Statement";
import { Terminal } from "./Terminal";

export class FunctionBody extends ParsedUnit implements Synthesizable {
    statements: Statement[] = [];

    accept(): boolean {
        const open = new Terminal(this.source, this.mark);
        if (!open.accept_token(TokenType.OpenBrace)) return why_not("Expected opening brace");
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
                if (!s.accept()) return why_not("Expected statement or closing brace");
                this.accepted(s);
                statements.push(s);
            }
        }

        this.statements = statements;

        this.parts.push(open, close);
        return true;
    }

    synthesize(): string {
        return this.statements.map(x => x.synthesize()).join("\n");
    }
}