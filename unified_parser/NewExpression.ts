import { IRAlloca, IRBaseType, IRBitcast, IRBlock, IRCall, IRFunctionType, IRNamedIdentifier, IRNumericLiteral, IRPointerType, IRSomethingElse, IRStore, IRTemporary, IRVoidCall, Synthesizable } from "../generator/IR";
import { StaticFunctionRegistry } from "../registry/StaticVariableRegistry";
import { ASTElement } from "./ASTElement";
import { TypeLiteral } from "./Parser";
import { ClassType, TypeObject } from "./TypeObject";

export class NewExpression extends ASTElement implements Synthesizable {
    constructor(parent: ASTElement, type: TypeObject) {
        super(type, parent);
    }
    toString = () => `new ${this.value_type.toString()}`;
    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if (this._ir_block) return this._ir_block;

        const initializer = StaticFunctionRegistry.get(`__${(this.value_type as ClassType).source.name}_initialize`);

        const temp1 = new IRTemporary();
        const temp2 = new IRTemporary();
        const temp3 = new IRTemporary();
        return this._ir_block = {
            output_location: {
                type: new IRPointerType(this.value_type.toIR()),
                location: temp3
            },
            statements: [
                new IRCall({
                    type: new IRPointerType(new IRBaseType("i8")),
                    location: temp1
                }, {
                    type: new IRPointerType(new IRFunctionType(new IRPointerType(new IRBaseType("i8")), [
                        new IRBaseType("i64"),
                        new IRBaseType("i64")
                    ])),
                    location: new IRNamedIdentifier("@calloc")
                }, [
                    {
                        type: new IRBaseType("i64"),
                        location: new IRNumericLiteral(1)
                    },
                    {
                        type: new IRBaseType("i64"),
                        location: new IRNumericLiteral(128), // TODO HOLY FUCK
                    }
                ]),
                new IRBitcast({
                    type: this.value_type.toIR(),
                    location: temp2
                }, {
                    type: new IRPointerType(new IRBaseType("i8")),
                    location: temp1
                }),
                new IRAlloca({
                    type: new IRPointerType(this.value_type.toIR()),
                    location: temp3
                }),
                new IRStore({
                    type: this.value_type.toIR(),
                    location: temp2
                }, {
                    type: new IRPointerType(this.value_type.toIR()),
                    location: temp3
                }),
                new IRVoidCall({
                    type: new IRPointerType(new IRFunctionType(this.value_type.toIR(), [])),
                    location: new IRNamedIdentifier(`@${initializer.name}`)
                }, [{
                    type: this.value_type.toIR(),
                    location: temp2
                }])
            ]
        };
    }
}
