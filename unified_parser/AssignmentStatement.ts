import { ASTElement, VoidElement } from "./ASTElement";
import { AssignmentExpression } from "./AssignmentExpression";
import { Synthesizable } from "../generator/IR";


export class AssignmentStatement extends VoidElement implements Synthesizable {
    expression: AssignmentExpression;
    constructor(parent: ASTElement, expression: AssignmentExpression) {
        super(parent);
        this.expression = expression;
    }

    toString = () => `AssignmentStatement`;
    synthesize = () => this.expression.synthesize();
}
