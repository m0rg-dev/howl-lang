import { SourceLocation } from "../ASTElement";
import { ExpressionElement } from "../ExpressionElement";


export class FieldReferenceExpression extends ExpressionElement {
    source: ExpressionElement;
    name: string;

    constructor(loc: SourceLocation, source: ExpressionElement, name: string) {
        super(loc);
        this.source = source;
        this.name = name;
    }

    toString() {
        return `${this.source}.${this.name}`;
    }

    clone() {
        return new FieldReferenceExpression(this.source_location, this.source.clone() as ExpressionElement, this.name);
    }
}
