import { SourceLocation } from "../ASTElement";
import { ExpressionElement } from "../ExpressionElement";


export class ComparisonExpression extends ExpressionElement {
    lhs: ExpressionElement;
    rhs: ExpressionElement;
    what: string;

    constructor(loc: SourceLocation, lhs: ExpressionElement, rhs: ExpressionElement, what: string) {
        super(loc);
        this.lhs = lhs;
        this.rhs = rhs;
        this.what = what;
    }

    toString() {
        return `${this.lhs} ${this.what} ${this.rhs}`;
    }

    clone() {
        return new ComparisonExpression(this.source_location, this.lhs.clone() as ExpressionElement, this.rhs.clone() as ExpressionElement, this.what);
    }
}
