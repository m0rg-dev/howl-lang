import { Lexer, LexerHandle } from "../lexer";
import { NameToken } from "../lexer/NameToken";
import { TokenType } from "../lexer/TokenType";
import { ASTElement, ErrorBadToken, ErrorBadType, Ok, ParseResult } from "./ASTElement";
import { Type, TypeRegistry } from "../generator/TypeRegistry";

export class TypedItem extends ASTElement {
    type: Type;
    name: string;

    static build(name: string, type: Type): TypedItem {
        const rc = new TypedItem();
        rc.type = type;
        rc.name = name;
        return rc;
    }

    bracket(handle: LexerHandle): LexerHandle {
        const sub = handle.clone();
        sub.expect(TokenType.Name);
        sub.expect(TokenType.Name);

        return handle.bracket(0, handle.compare(sub));
    }

    parse(handle: LexerHandle): ParseResult {
        if (handle.lookahead().type != TokenType.Name) return { ok: false, errors: [ErrorBadToken(handle, TokenType.Name)] };
        const type = (handle.consume() as NameToken);

        if (handle.lookahead().type != TokenType.Name) return { ok: false, errors: [ErrorBadToken(handle, TokenType.Name)] };
        const name = (handle.consume() as NameToken);

        if (!TypeRegistry.has(type.name)) {
            return { ok: false, errors: [ErrorBadType(handle, type.name)] }
        }

        this.type = TypeRegistry.get(type.name);
        this.name = name.name;
        return Ok();
    }

    synthesize(): string {
        throw new Error("TypedItems cannot be synthesized directly.");
    }

    to_readable(): string {
        return `${this.name}<${this.type.to_readable()}>`;
    }
}
