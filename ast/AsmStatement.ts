import { LexerHandle } from "../lexer";
import { AsmLiteralToken } from "../lexer/AsmLiteralToken";
import { TokenType } from "../lexer/TokenType";
import { ASTElement, Ok, ParseResult } from "./ASTElement";

export class AsmStatement extends ASTElement {
    statement_text: string;

    bracket(handle: LexerHandle): LexerHandle {
        const sub = handle.clone();
        sub.expect(TokenType.AsmLiteral);
        sub.expect(TokenType.Semicolon);

        return handle.bracket(0, handle.compare(sub));
    }

    parse(handle: LexerHandle): ParseResult {
        this.statement_text = (handle.consume() as AsmLiteralToken).source;

        return Ok();
    }

    synthesize(): string {
        return this.statement_text;
    }
}
