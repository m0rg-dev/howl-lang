import { LexerHandle } from "../lexer";
import { NameToken } from "../lexer/NameToken";
import { TokenType } from "../lexer/TokenType";
import { ASTElement, ErrorBadToken, Ok, ParseResult } from "./ASTElement";
import { RecognizeBlock } from "./ASTUtil";

export type ClassField = {
    type: string;
    name: string;
}

export class Class extends ASTElement {
    name: string;
    fields: ClassField[] = [];

    bracket(handle: LexerHandle): LexerHandle {
        const sub = handle.clone();
        sub.expect(TokenType.Class);
        sub.expect(TokenType.Name);

        sub.check(TokenType.OpenBrace);
        RecognizeBlock(sub);

        return handle.bracket(0, handle.compare(sub));
    }

    parse(handle: LexerHandle): ParseResult {
        if (handle.lookahead().type != TokenType.Class) throw new Error("COMPILER BUG");
        handle.consume();

        if (handle.lookahead().type != TokenType.Name) return { ok: false, errors: [ErrorBadToken(handle, TokenType.Name)] };
        const name = (handle.consume() as NameToken);

        if (handle.lookahead().type != TokenType.OpenBrace) return { ok: false, errors: [ErrorBadToken(handle, TokenType.OpenBrace)] };
        handle.consume();
        
        this.name = name.name;

        while (handle.lookahead() && handle.lookahead().type != TokenType.CloseBrace) {
            if (handle.match(TokenType.Name, TokenType.Name, TokenType.Semicolon)) {
                const type = (handle.consume() as NameToken);
                const name = (handle.consume() as NameToken);
                handle.consume();

                this.fields.push({ type: type.name, name: name.name });
            } else {
                return { ok: false, errors: [ErrorBadToken(handle, TokenType.Name)] };
            }
        }
        
        if (handle.lookahead().type != TokenType.CloseBrace) return { ok: false, errors: [ErrorBadToken(handle, TokenType.CloseBrace)] };

        return Ok();
    }

    synthesize(): string {
        return [
            `%${this.name} = type {`,
            ...this.fields.map((x, y) => `    ${x.type}${y == this.fields.length - 1 ? " ": ","}        ;; ${x.name}`),
            `}`
        ].join("\n");
    }
}
