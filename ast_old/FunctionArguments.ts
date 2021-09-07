import { TokenType } from "../lexer/TokenType";
import { ParsedUnit } from "./ParsedUnit";
import { ParseResult } from "./ParseResult";
import { Terminal } from "./Terminal";

export class FunctionArguments extends ParsedUnit {
    accept(): ParseResult {
        const open = new Terminal(this.source, this.mark);
        if (!open.accept_token(TokenType.OpenParen)) return ParseResult.WrongToken(this, TokenType.OpenParen);
        this.accepted(open);

        const close = new Terminal(this.source, this.mark);
        if (!close.accept_token(TokenType.CloseParen)) return ParseResult.WrongToken(this, TokenType.CloseParen);
        this.accepted(close);

        this.parts.push(open, close);
        return ParseResult.Ok();
    }
}