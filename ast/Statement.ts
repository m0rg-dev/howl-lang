import { Synthesizable } from "../generator";
import { why_not } from "../parser";
import { TokenType } from "../TokenType";
import { ParsedUnit } from "./ParsedUnit";
import { ReturnStatement } from "./ReturnStatement";
import { Terminal } from "./Terminal";

export class Statement extends ParsedUnit implements Synthesizable {
    sub_statement: Synthesizable;

    accept(): boolean {
        const ret = new ReturnStatement(this.source, this.mark);
        if(!ret.accept()) return why_not("Expected return statement");
        this.accepted(ret);

        const semi = new Terminal(this.source, this.mark);
        if (!semi.accept_token(TokenType.Semicolon)) return false;
        this.accepted(semi);

        this.sub_statement = ret;
        this.parts.push(ret, semi);

        return true;
    }

    synthesize(): string {
        return this.sub_statement.synthesize();
    }
}
