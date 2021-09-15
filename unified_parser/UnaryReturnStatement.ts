import { IRBlock, Synthesizable } from "../generator/IR";
import { ASTElement } from "./ASTElement";
import { UnaryReturnExpression } from "./UnaryReturnExpression";


export class UnaryReturnStatement extends ASTElement implements Synthesizable {
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
