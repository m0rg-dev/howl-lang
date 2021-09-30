import { PartialElement } from "./ASTElement";

export class PartialCompoundStatementElement extends PartialElement {
    toString() {
        return `PartialCompoundStatement(...${this.body.length})`;
    }
}
