import { SourceLocation } from "../ASTElement";
import { ExpressionElement } from "../ExpressionElement";


export class NumberExpression extends ExpressionElement {
    value: number;

    constructor(loc: SourceLocation, value: number) {
        super(loc);
        this.value = value;
    }

    toString() {
        return `#${this.value}`;
    }

    clone() {
        return new NumberExpression(this.source_location, this.value);
    }
}
