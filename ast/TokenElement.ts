import { AsmLiteralToken } from "../lexer/AsmLiteralToken";
import { NameToken } from "../lexer/NameToken";
import { NumericLiteralToken } from "../lexer/NumericLiteralToken";
import { StringLiteralToken } from "../lexer/StringLiteralToken";
import { Token } from "../lexer/Token";
import { ASTElement } from "./ASTElement";


export class TokenElement<T extends Token> extends ASTElement {
    token: T;

    constructor(token: T) {
        super([token.start, token.start + token.length]);
        this.token = token;
    }

    clone(): TokenElement<T> {
        return new TokenElement(this.token);
    }

    toString(): string {
        return `"${this.token.text.trim()}"`;
    }
}
