import { SourceLocation } from "../ASTElement";
import { ExpressionElement } from "../ExpressionElement";

export class StringConstantExpression extends ExpressionElement {
    value: string;

    constructor(loc: SourceLocation, value: string) {
        super(loc);
        this.value = value;
    }

    toString() {
        return `"${this.value}"`;
    }

    clone() {
        return new StringConstantExpression(this.source_location, this.value);
    }
}
