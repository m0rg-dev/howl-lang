import { flattenBlock, IRBaseType, IRBlock, IRBranch, IRConditionalBranch, IRLabel, IRLabelStatement, IRLoad, IRPointerType, IRTemporary, isSynthesizable, Synthesizable } from "../generator/IR";
import { ASTElement, VoidElement } from "./ASTElement";
import { CompoundStatement } from "./CompoundStatement";

export class IfStatement extends VoidElement implements Synthesizable {
    condition: ASTElement;
    body: CompoundStatement;

    constructor(condition: ASTElement, body: CompoundStatement) {
        super();
        this.condition = condition;
        this.body = body;
    }

    toString = () => `if(${this.condition})`;

    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if (this._ir_block) return this._ir_block;
        if (!isSynthesizable(this.condition)) return { output_location: undefined, statements: [] };
        if (!isSynthesizable(this.body)) return { output_location: undefined, statements: [] };

        const cond_block = this.condition.synthesize();
        const cond_temp = new IRTemporary();

        const cond_load = new IRLoad(
            { type: (cond_block.output_location.type as IRPointerType).sub, location: cond_temp },
            cond_block.output_location
        );

        const after_label = new IRLabel();

        const statements = [
            cond_load,
            new IRConditionalBranch(
                this.body.label,
                after_label,
                { type: (cond_block.output_location.type as IRPointerType).sub, location: cond_temp }
            ),
            ...flattenBlock(this.body.synthesize()),
            new IRLabelStatement(after_label)
        ];

        return this._ir_block = {
            output_location: undefined,
            statements: statements,
            sub_blocks: [
                cond_block
            ]
        };
    }
}
