import { GEPPointerStatement, GEPStringConstantStatement, IRAlloca, IRArrayType, IRBaseType, IRBlock, IRPointerType, IRSomethingElse, IRStore, IRTemporary, Synthesizable } from "../generator/IR";
import { StaticInitializer, StaticVariableRegistry } from "../registry/StaticVariableRegistry";
import { GetType } from "../registry/TypeRegistry";
import { ExactConstraint } from "../typemath/Signature";
import { ASTElement } from "./ASTElement";
import { BaseType, RawPointerType } from "./TypeObject";

export class StringInitializer extends StaticInitializer implements Synthesizable {
    value: string;
    guid: string;
    constructor(value: string, guid: string) {
        super();
        this.value = value;
        this.guid = guid;
    }

    _ir_block: IRBlock;
    synthesize(): IRBlock {
        return {
            output_location: undefined,
            statements: [
                new IRSomethingElse(`@"${this.guid}" = constant [${this.value.length + 1} x i8] c"${this.value}\\00"`)
            ]
        }
    }
}

export class StringLiteralExpression extends ASTElement implements Synthesizable {
    value: string;
    wrapped = false;

    constructor(parent: ASTElement, value: string) {
        super(parent);
        this.value = value;
        // this.signature.ports.add("value");
        // this.signature.type_constraints.set("value", new ExactConstraint("value", new RawPointerType(GetType("i8"))));
        StaticVariableRegistry.set(this.guid, {
            type: new RawPointerType(new BaseType("i8")),
            initializer: new StringInitializer(this.value, this.guid)
        })
    }
    toString = () => this.value;

    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if (this._ir_block) return { output_location: this._ir_block.output_location, statements: [] };

        const temp1 = new IRTemporary();
        const temp2 = new IRTemporary();
        const gep = new GEPStringConstantStatement({
            type: new IRPointerType(new IRBaseType("i8")),
            location: temp1
        }, {
            type: new IRPointerType(new IRArrayType(new IRBaseType("i8"), this.value.length + 1)),
            location: `@"${this.guid}"`
        });

        const ir_alloca = new IRAlloca({
            type: new IRPointerType(new IRPointerType(new IRBaseType("i8"))),
            location: temp2
        });
        const ir_store = new IRStore({
            type: new IRPointerType(new IRBaseType("i8")),
            location: temp1
        }, {
            type: new IRPointerType(new IRPointerType(new IRBaseType("i8"))),
            location: temp2
        });

        return this._ir_block = {
            output_location: {
                type: new IRPointerType(new IRPointerType(new IRBaseType("i8"))),
                location: temp2
            },
            statements: [
                gep,
                ir_alloca,
                ir_store
            ]
        };
    }
}