import { IRBlock, IRNullaryReturn, Synthesizable } from "../generator/IR";
import { ASTElement } from "./ASTElement";


export class NullaryReturnExpression extends ASTElement implements Synthesizable {
    toString = () => `return void`;

    synthesize(): IRBlock {
        return {
            output_location: undefined,
            statements: [
                new IRNullaryReturn()
            ]
        }
    }
}
