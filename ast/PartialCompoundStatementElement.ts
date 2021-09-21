import { PartialElement } from "./ASTElement";
import { SignatureElement } from "./SignatureElement";

export class PartialCompoundStatementElement extends PartialElement {
    toString() {
        // TODO
        if(this.body[0] instanceof SignatureElement) {
            return `PartialCompoundStatement(${this.body[0]})`;
        }
        return "PartialCompoundStatement";
    }
}
