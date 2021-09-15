import { IRAlloca, IRBaseType, IRBitcast, IRBlock, IRCall, IRFunctionType, IRNamedIdentifier, IRNumericLiteral, IRPointerType, IRSomethingElse, IRStore, IRTemporary, IRVoidCall, Synthesizable } from "../generator/IR";
import { StaticFunctionRegistry } from "../registry/StaticVariableRegistry";
import { ExactConstraint } from "../typemath/Signature";
import { ASTElement } from "./ASTElement";
import { TypeLiteral } from "./Parser";
import { ClassType, TypeObject } from "./TypeObject";

export class NewExpression extends ASTElement implements Synthesizable {
    field_type: TypeObject;

    constructor(parent: ASTElement, type: TypeObject) {
        super(parent);
        this.field_type = type;

        // this.signature.ports.add("value");
        // this.signature.type_constraints.set("value", new ExactConstraint("value", type));
        this.value_constraint = new ExactConstraint(type);
    }
    toString = () => `new ${this.field_type.toString()}`;
    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if (this._ir_block) return { output_location: this._ir_block.output_location, statements: [] };

        const initializer = StaticFunctionRegistry.get(`__${(this.field_type as ClassType).source.name}_initialize`);

        const temp1 = new IRTemporary();
        const temp2 = new IRTemporary();
        const temp3 = new IRTemporary();
        return this._ir_block = {
            output_location: {
                type: new IRPointerType(this.field_type.toIR()),
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
                    type: this.field_type.toIR(),
                    location: temp2
                }, {
                    type: new IRPointerType(new IRBaseType("i8")),
                    location: temp1
                }),
                new IRAlloca({
                    type: new IRPointerType(this.field_type.toIR()),
                    location: temp3
                }),
                new IRStore({
                    type: this.field_type.toIR(),
                    location: temp2
                }, {
                    type: new IRPointerType(this.field_type.toIR()),
                    location: temp3
                }),
                new IRVoidCall({
                    type: new IRPointerType(new IRFunctionType(this.field_type.toIR(), [])),
                    location: new IRNamedIdentifier(`@${initializer.name}`)
                }, [{
                    type: this.field_type.toIR(),
                    location: temp2
                }])
            ]
        };
    }
}
