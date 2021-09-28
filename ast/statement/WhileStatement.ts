import { ASTElement, SourceLocation } from "../ASTElement";
import { CompoundStatementElement } from "../CompoundStatementElement";
import { ExpressionElement } from "../ExpressionElement";
import { StatementElement } from "../StatementElement";

export class WhileStatement extends StatementElement {
    condition: ExpressionElement;
    body: CompoundStatementElement;

    constructor(loc: SourceLocation, condition: ExpressionElement, body: CompoundStatementElement) {
        super(loc);
        this.condition = condition;
        this.body = body;
    }

    toString() { return `while(${this.condition}) ${this.body}` }
    clone() {
        return new WhileStatement(this.source_location, this.condition.clone() as ExpressionElement, this.body.clone());
    }
}
