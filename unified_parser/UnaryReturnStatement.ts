import { IRBlock, Synthesizable } from "../generator/IR";
import { VoidElement } from "./ASTElement";
import { UnaryReturnExpression } from "./UnaryReturnExpression";


export class UnaryReturnStatement extends VoidElement implements Synthesizable {
    expression: UnaryReturnExpression;
    constructor(expression: UnaryReturnExpression) {
        super();
        this.expression = expression;
    }

    toString = () => `UnaryReturnStatement`;

    synthesize(): IRBlock {
        return this.expression.synthesize();
    }
}
