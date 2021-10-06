import { CompilationUnit } from "../driver/CompilationUnit";
import { Token } from "../lexer/Token";
import { ASTElement } from "./ASTElement";


export class TokenElement<T extends Token> extends ASTElement {
    token: T;
    cu: CompilationUnit;

    constructor(token: T, cu: CompilationUnit) {
        super([cu, token.start, token.start + token.length]);
        this.token = token;
        this.cu = cu;
    }

    clone(): TokenElement<T> {
        return new TokenElement(this.token, this.cu);
    }

    toString(): string {
        return `'${this.token.text.trim()}'`;
    }
}
