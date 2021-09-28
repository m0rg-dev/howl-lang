import { SourceLocation } from "../ASTElement";
import { ExpressionElement } from "../ExpressionElement";


export class IndexExpression extends ExpressionElement {
    source: ExpressionElement;
    index: ExpressionElement;

    constructor(loc: SourceLocation, source: ExpressionElement, index: ExpressionElement) {
        super(loc);
        this.source = source;
        this.index = index;
    }

    toString() {
        return `${this.source}[${this.index}]`;
    }

    clone() {
        return new IndexExpression(this.source_location, this.source.clone() as ExpressionElement, this.index.clone() as ExpressionElement);
    }
}
