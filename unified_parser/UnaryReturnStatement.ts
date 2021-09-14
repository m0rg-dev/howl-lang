import { IRBlock, Synthesizable } from "../generator/IR";
import { ASTElement, VoidElement } from "./ASTElement";
import { UnaryReturnExpression } from "./UnaryReturnExpression";


export class UnaryReturnStatement extends VoidElement implements Synthesizable {
    expression: UnaryReturnExpression;
    constructor(parent: ASTElement, expression: UnaryReturnExpression) {
        super(parent);
        this.expression = expression;
    }

    toString = () => `UnaryReturnStatement`;

    synthesize(): IRBlock {
        return this.expression.synthesize();
    }
}
