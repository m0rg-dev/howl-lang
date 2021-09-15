import { flattenBlock, IRAlloca, IRBlock, IRNamedIdentifier, IRPointerType, IRSomethingElse, IRStatement, IRStore, Synthesizable } from "../generator/IR";
import { ExactConstraint } from "../typemath/Signature";
import { ASTElement } from "./ASTElement";
import { CompoundStatement } from "./CompoundStatement";
import { ArgumentDefinition } from "./Parser";
import { FunctionType, TypeObject } from "./TypeObject";

export class FunctionConstruct extends ASTElement implements Synthesizable {
    name: string;
    return_type: TypeObject;
    args: ArgumentDefinition[];
    body?: CompoundStatement;
    function_is_static: boolean;
    constructor(parent: ASTElement, name: string, rc: TypeObject, args: ArgumentDefinition[], function_is_static: boolean) {
        super(parent);
        this.name = name;
        this.hasOwnScope = true;
        args.forEach(x => this.scope.locals.set(x.name, x.field_type));
        this.args = args;
        this.return_type = rc;
        this.function_is_static = function_is_static;

        this.signature.ports.add("value");
        this.signature.type_constraints.set("value", new ExactConstraint("value", new FunctionType(
            rc, args.map(x => x.field_type)
        )));
    }

    as_type(): FunctionType {
        return new FunctionType(
            this.return_type, this.args.map(x => x.field_type)
        );
    }

    toString = () => `fn ${this.name}`;

    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if (this._ir_block) return this._ir_block;

        if (this.body) {
            const statements: IRStatement[] = [];

            statements.push(new IRSomethingElse(`define ${this.return_type.toIR()} @${this.name}(${this.args.map(x => x.field_type.toIR() + " %__arg_" + x.name)}) {`));

            this.args.forEach(x => {
                statements.push(new IRAlloca({ type: new IRPointerType(x.field_type.toIR()), location: new IRNamedIdentifier(`%${x.name}`) }));
                statements.push(new IRStore(
                    { type: x.field_type.toIR(), location: new IRNamedIdentifier(`%__arg_${x.name}`) },
                    { type: new IRPointerType(x.field_type.toIR()), location: new IRNamedIdentifier(`%${x.name}`) }
                ));
            })

            statements.push(...flattenBlock(this.body.synthesize()));

            statements.push(new IRSomethingElse("}"));

            console.error(statements);
            return { output_location: undefined, statements: statements };
        } else {
            return {
                output_location: undefined, statements: [
                    new IRSomethingElse(`declare ${this.return_type.toIR()} @${this.name}(${this.args.map(x => x.field_type.toIR())})`)
                ]
            };
        }
    }
}
