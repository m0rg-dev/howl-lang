import { VoidElement } from "./ASTElement";
import { AssignmentExpression } from "./AssignmentExpression";
import { Synthesizable } from "../generator/IR";


export class AssignmentStatement extends VoidElement implements Synthesizable {
    expression: AssignmentExpression;
    constructor(expression: AssignmentExpression) {
        super();
        this.expression = expression;
    }

    toString = () => `AssignmentStatement`;
    synthesize = () => this.expression.synthesize();
}
