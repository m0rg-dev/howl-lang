import { SourceLocation } from "../ASTElement";
import { ExpressionElement } from "../ExpressionElement";
import { StatementElement } from "../StatementElement";


export class AssignmentStatement<LHS extends ExpressionElement, RHS extends ExpressionElement> extends StatementElement {
    lhs: LHS;
    rhs: RHS;

    constructor(loc: SourceLocation, lhs: LHS, rhs: RHS) {
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
        return `${this.lhs} = ${this.rhs};`;
    }
}
