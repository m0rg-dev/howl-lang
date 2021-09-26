import { SourceLocation } from "../ASTElement";
import { ExpressionElement } from "../ExpressionElement";
import { StatementElement } from "../StatementElement";


export class AssignmentStatement extends StatementElement {
    lhs: ExpressionElement;
    rhs: ExpressionElement;

    constructor(loc: SourceLocation, lhs: ExpressionElement, rhs: ExpressionElement) {
        super(loc);
        this.lhs = lhs;
        this.rhs = rhs;
    }

    clone() {
        return new AssignmentStatement(this.source_location,
            this.lhs.clone() as ExpressionElement,
            this.rhs.clone() as ExpressionElement);
    }

    toString() {
        return `${this.lhs} = ${this.rhs}`;
    }
}
