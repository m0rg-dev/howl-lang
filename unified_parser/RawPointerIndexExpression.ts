import { GEPPointerStatement, IRBlock, IRLoad, IRPointerType, IRTemporary, IRType, isSynthesizable, Synthesizable } from "../generator/IR";
import { TypeRegistry } from "../registry/TypeRegistry";
import { ASTElement } from "./ASTElement";
import { RawPointerType } from "./TypeObject";

export class RawPointerIndexExpression extends ASTElement implements Synthesizable {
    source: ASTElement;
    index: ASTElement;

    constructor(parent: ASTElement, source: ASTElement, index: ASTElement) {
        super((source.value_type as RawPointerType).subtype, parent);
        this.source = source;
        this.index = index;
    }

    toString = () => `${this.source}*[${this.index}]`;
    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if (this._ir_block) return this._ir_block;
        if (!isSynthesizable(this.source)) throw new Error("attempted to synthesize RawPointerIndexExpression of non-synthesizable");
        if (!isSynthesizable(this.index)) throw new Error("attempted to synthesize RawPointerIndexExpression indexed by non-synthesizable");

        const source_block = this.source.synthesize();
        const index_block = this.index.synthesize();

        const temp_src = new IRTemporary();
        const temp_idx = new IRTemporary();
        const out = new IRTemporary();
        return this._ir_block = {
            output_location: {
                type: this.source.value_type.toIR(),
                location: out
            },
            statements: [
                new IRLoad({
                    type: this.value_type.toIR(),
                    location: temp_src
                }, source_block.output_location),
                new IRLoad({
                    type: TypeRegistry.get("i64"),
                    location: temp_idx
                }, index_block.output_location),
                new GEPPointerStatement({
                    type: this.value_type.toIR(),
                    location: out
                }, {
                    type: new IRPointerType(this.value_type.toIR()),
                    location: temp_src
                }, {
                    type: TypeRegistry.get("i64"),
                    location: temp_idx
                })
            ],
            sub_blocks: [
                source_block,
                index_block
            ]
        };
    }
}