import { IRAlloca, IRBaseType, IRBitcast, IRBlock, IRCall, IRFunctionType, IRNamedIdentifier, IRNumericLiteral, IRPointerType, IRSomethingElse, IRStore, IRTemporary, IRVoidCall, Synthesizable } from "../generator/IR";
import { StaticFunctionRegistry } from "../registry/StaticVariableRegistry";
import { ASTElement } from "./ASTElement";
import { FunctionCallExpression } from "./FunctionCallExpression";
import { TypeLiteral, UnresolvedTypeLiteral } from "./Parser";
import { ClassType } from "./TypeObject";
import { VariableReferenceExpression } from "./VariableReferenceExpression";

export class NewExpression extends ASTElement implements Synthesizable {
    type_literal: TypeLiteral | UnresolvedTypeLiteral;
    constructor(type: TypeLiteral | UnresolvedTypeLiteral) {
        super();
        this.type_literal = type;
    }
    toString = () => `new ${this.type_literal.value_type.toString()}`;
    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if (this._ir_block) return this._ir_block;

        const initializer = StaticFunctionRegistry.get(`__${(this.type_literal.value_type as ClassType).source.name}_initialize`);

        const temp1 = new IRTemporary();
        const temp2 = new IRTemporary();
        const temp3 = new IRTemporary();
        return this._ir_block = {
            output_location: {
                type: new IRPointerType(this.type_literal.value_type.toIR()),
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
                    type: this.type_literal.value_type.toIR(),
                    location: temp2
                }, {
                    type: new IRPointerType(new IRBaseType("i8")),
                    location: temp1
                }),
                new IRAlloca({
                    type: new IRPointerType(this.type_literal.value_type.toIR()),
                    location: temp3
                }),
                new IRStore({
                    type: this.type_literal.value_type.toIR(),
                    location: temp2
                }, {
                    type: new IRPointerType(this.type_literal.value_type.toIR()),
                    location: temp3
                }),
                new IRVoidCall({
                    type: new IRPointerType(new IRFunctionType(this.type_literal.value_type.toIR(), [])),
                    location: new IRNamedIdentifier(`@${initializer.name}`)
                }, [{
                    type: this.type_literal.value_type.toIR(),
                    location: temp2
                }])
            ]
        };
    }
}
