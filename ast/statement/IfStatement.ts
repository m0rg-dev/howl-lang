import { SourceLocation } from "../ASTElement";
import { CompoundStatementElement } from "../CompoundStatementElement";
import { ExpressionElement } from "../ExpressionElement";
import { StatementElement } from "../StatementElement";

export class IfStatement extends StatementElement {
    conditions: ExpressionElement[];
    bodies: CompoundStatementElement[];

    constructor(loc: SourceLocation, conditions: ExpressionElement[], bodies: CompoundStatementElement[]) {
        super(loc);
        this.conditions = conditions;
        this.bodies = bodies;
    }

    toString() {
        return `if ${this.conditions.join(", ")} ${this.bodies.join(", ")}`;
    }

    clone() {
        return new IfStatement(this.source_location, this.conditions.map(e => e.clone()) as ExpressionElement[], this.bodies.map(b => b.clone()));
    }
}
