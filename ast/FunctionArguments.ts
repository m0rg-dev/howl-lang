import { why_not } from "../parser";
import { TokenType } from "../TokenType";
import { ParsedUnit } from "./ParsedUnit";
import { Terminal } from "./Terminal";

export class FunctionArguments extends ParsedUnit {
    accept(): boolean {
        const open = new Terminal(this.source, this.mark);
        if (!open.accept_token(TokenType.OpenParen)) return why_not("Expected opening parenthesis");
        this.accepted(open);

        const close = new Terminal(this.source, this.mark);
        if (!close.accept_token(TokenType.CloseParen)) return why_not("Expected closing parenthesis");
        this.accepted(close);

        this.parts.push(open, close);
        return true;
    }
}