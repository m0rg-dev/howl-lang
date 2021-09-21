import { PartialElement } from "./ASTElement";

export class PartialArgumentListElement extends PartialElement {
    toString() {
        return `PartialArgumentList(${this.body.map(x => x.toString()).join(" ")})`;
    }
}
