import { NameToken } from "../lexer/NameToken";
import { Token } from "../lexer/Token";
import { TokenType } from "../lexer/TokenType";
import { PartialElement, SourceLocation, ASTElement } from "./ASTElement";
import { TokenElement } from "./TokenElement";


export class PartialClassElement extends PartialElement {
    name: string;
    generics: string[] = [];

    constructor(loc: SourceLocation, body: ASTElement[], name: string) {
        super(loc, body);
        this.name = name;

        // TODO
        let i = 3;
        while ((body[i] as TokenElement<Token>).token?.type != TokenType.CloseAngle) {
            if (body[i] instanceof TokenElement
                && (body[i] as TokenElement<NameToken>).token.name) {
                this.generics.push((body[i] as TokenElement<NameToken>).token.name);
            }
            i++;
        }
    }

    toString() {
        return `PartialClass<${this.generics.join(", ")}>(${this.name})`;
    }
}
