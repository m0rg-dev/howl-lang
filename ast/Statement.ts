import { Synthesizable } from "../generator";
import { why_not } from "../parser";
import { TokenType } from "../TokenType";
import { ParsedUnit } from "./ParsedUnit";
import { ParseResult } from "./ParseResult";
import { ReturnStatement } from "./ReturnStatement";
import { Terminal } from "./Terminal";

export class Statement extends ParsedUnit implements Synthesizable {
    sub_statement: Synthesizable;

    accept(): ParseResult {
        const ret = new ReturnStatement(this.source, this.mark);
        const err = ret.accept();
        if(!err.ok) return err.append(ParseResult.Fail(this, "Expected return statement"));
        this.accepted(ret);

        const semi = new Terminal(this.source, this.mark);
        if (!semi.accept_token(TokenType.Semicolon)) return ParseResult.WrongToken(this, TokenType.Semicolon);
        this.accepted(semi);

        this.sub_statement = ret;
        this.parts.push(ret, semi);

        return ParseResult.Ok();
    }

    synthesize(): string {
        return this.sub_statement.synthesize();
    }
}
