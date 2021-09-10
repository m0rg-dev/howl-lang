import { LexerHandle } from "../lexer";
import { NameToken } from "../lexer/NameToken";
import { TokenType } from "../lexer/TokenType";
import { ASTElement, ErrorBadToken, Ok, ParseResult, Segment } from "./ASTElement";
import { RecognizeBlock } from "./ASTUtil";
import { CompoundStatement } from "./CompoundStatement";
import { SimpleStatement } from "./SimpleStatement";

export class FunctionDefinition extends ASTElement {
    name: string;
    body: CompoundStatement;

    bracket(handle: LexerHandle): LexerHandle {
        const sub = handle.clone();
        sub.expect(TokenType.Function);
        sub.expect(TokenType.Name);

        sub.check(TokenType.OpenParen);
        RecognizeBlock(sub);

        sub.check(TokenType.OpenBrace);
        RecognizeBlock(sub);

        return handle.bracket(0, handle.compare(sub));
    }

    parse(handle: LexerHandle): ParseResult {
        if (handle.lookahead().type != TokenType.Function) throw new Error("COMPILER BUG");
        handle.consume();

        if (handle.lookahead().type != TokenType.Name) return { ok: false, errors: [ErrorBadToken(handle, TokenType.Name)] };
        const name = (handle.consume() as NameToken);

        if (handle.lookahead().type != TokenType.OpenParen) return { ok: false, errors: [ErrorBadToken(handle, TokenType.OpenParen)] };
        handle.consume();

        if (handle.lookahead().type != TokenType.CloseParen) return { ok: false, errors: [ErrorBadToken(handle, TokenType.CloseParen)] };
        handle.consume();

        this.name = name.name;
        this.body = new CompoundStatement();

        return this.body.parse(handle);
    }

    synthesize(): string {
        return [
            `define i32 @${this.name}() {`,
            this.body.synthesize(),
            `}`
        ].join("\n");
    }
}