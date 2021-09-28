import { SourceLocation } from "../ASTElement";
import { CompoundStatementElement } from "../CompoundStatementElement";
import { ExpressionElement } from "../ExpressionElement";
import { StatementElement } from "../StatementElement";

export class IfStatement extends StatementElement {
    condition: ExpressionElement;
    body: CompoundStatementElement;

    constructor(loc: SourceLocation, condition: ExpressionElement, body: CompoundStatementElement) {
        super(loc);
        this.condition = condition;
        this.body = body;
    }

    toString() { return `if(${this.condition}) ${this.body}` }
    clone() {
        return new IfStatement(this.source_location, this.condition.clone() as ExpressionElement, this.body.clone());
    }
}
