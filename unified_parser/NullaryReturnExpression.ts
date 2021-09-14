import { IRBlock, IRNullaryReturn, Synthesizable } from "../generator/IR";
import { VoidElement } from "./ASTElement";


export class NullaryReturnExpression extends VoidElement implements Synthesizable {
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
