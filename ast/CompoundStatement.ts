import { LexerHandle } from "../lexer";
import { TokenType } from "../lexer/TokenType";
import { ASTElement, ErrorBadToken, ErrorEOF, Ok, ParseResult, Segment } from "./ASTElement";
import { RecognizeBlock } from "./ASTUtil";
import { SimpleStatement } from "./SimpleStatement";

export class CompoundStatement extends ASTElement {
    lines: ASTElement[] = [];

    bracket(handle: LexerHandle): LexerHandle {
        const sub = handle.clone();
        sub.check(TokenType.OpenBrace);
        RecognizeBlock(sub);
        return handle.bracket(0, handle.compare(sub));
    }

    parse(handle: LexerHandle): ParseResult {
        if (handle.lookahead().type != TokenType.OpenBrace) return { ok: false, errors: [ErrorBadToken(handle, TokenType.OpenBrace)] };
        handle.consume();

        const segments: Segment[] = [];
        while (handle.lookahead() && handle.lookahead().type != TokenType.CloseBrace) {
            if (handle.lookahead().type == TokenType.OpenBrace) {
                const statement = new CompoundStatement();
                segments.push({ handle: statement.bracket(handle), ast: statement });
            } else if (handle.lookahead().type == TokenType.EOF) {
                return { ok: false, errors: [ErrorEOF(handle)] };
            } else {
                const statement = new SimpleStatement();
                segments.push({ handle: statement.bracket(handle), ast: statement });
            }
        }

        if (handle.lookahead().type != TokenType.CloseBrace) return { ok: false, errors: [ErrorBadToken(handle, TokenType.CloseBrace)] };

        const rc = Ok();
        for (const segment of segments) {
            console.error(`=> Source segment: <<<${segment.handle}>>>`);
            let rc2 = segment.ast.parse(segment.handle);
            if (!rc2.ok) {
                rc.ok = false;
                rc.errors.push(...rc2.errors);
            }
            this.lines.push(segment.ast);
        }

        return rc;
    }

    synthesize(): string {
        return this.lines.map(x => "    " + x.synthesize()).join("\n");
    }
}