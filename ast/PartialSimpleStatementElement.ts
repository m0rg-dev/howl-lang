import { PartialElement } from "./ASTElement";

export class PartialSimpleStatementElement extends PartialElement {
    toString() {
        return `PartialSimpleStatement(${this.body.map(x => x.toString()).join(" ")})`;
    }
}
