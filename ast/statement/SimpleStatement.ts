import { SourceLocation } from "../ASTElement";
import { ExpressionElement } from "../ExpressionElement";
import { StatementElement } from "../StatementElement";


export class SimpleStatement extends StatementElement {
    exp: ExpressionElement;

    constructor(loc: SourceLocation, exp: ExpressionElement) {
        super(loc);
        this.exp = exp;
    }

    clone() {
        return new SimpleStatement(this.source_location, this.exp.clone() as ExpressionElement);
    }

    toString() {
        return this.exp.toString();
    }
}
