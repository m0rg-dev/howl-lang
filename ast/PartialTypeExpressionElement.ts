import { PartialElement } from "./ASTElement";

export class PartialTypeExpressionElement extends PartialElement {
    toString() {
        return `PartialTypeExpression(${this.body.map(x => x.toString()).join(" ")})`;
    }
}
