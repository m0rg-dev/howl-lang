import { ASTElement, SourceLocation } from "./ASTElement";
import { TypeExpressionElement } from "./TypeExpressionElement";

export class SignatureElement extends ASTElement {
    expressions: TypeExpressionElement[];

    constructor(loc: SourceLocation, expressions: TypeExpressionElement[]) {
        super(loc);
        this.expressions = expressions;
    }

    toString() {
        return `Signature(${this.expressions.map(x => x.toString()).join(", ")})`;
    }

    clone() {
        return new SignatureElement(this.source_location, (this.expressions.map(x => x.clone()) as TypeExpressionElement[]));
    }
}
