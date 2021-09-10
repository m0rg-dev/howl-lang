import { LexerHandle } from "../lexer";
import { TokenType } from "../lexer/TokenType";
import { ASTElement, Ok, ParseResult } from "./ASTElement";

export class SimpleStatement extends ASTElement {
    statement_text: string;

    bracket(handle: LexerHandle): LexerHandle {
        const sub = handle.clone();
        sub.consume_through(TokenType.Semicolon);

        return handle.bracket(0, handle.compare(sub));
    }

    parse(handle: LexerHandle): ParseResult {
        this.statement_text = handle.toString().trim();

        return Ok();
    }

    synthesize(): string {
        return this.statement_text;
    }
}
