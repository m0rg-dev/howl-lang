import { flattenBlock, IRAlloca, IRBlock, IRLoad, IRNamedIdentifier, IRPointerType, IRSomethingElse, IRStatement, IRStore, isSynthesizable, Synthesizable } from "../generator/IR";
import { ASTElement, VoidElement } from "./ASTElement";
import { TypeLiteral, ArgumentDefinition } from "./Parser";
import { CompoundStatement } from "./CompoundStatement";
import { FunctionType } from "./TypeObject";


export class FunctionConstruct extends ASTElement implements Synthesizable {
    name: string;
    return_type_literal: TypeLiteral;
    args: ArgumentDefinition[];
    body?: CompoundStatement;
    constructor(parent: ASTElement, type: FunctionType, name: string, args: ArgumentDefinition[]) {
        super(type, parent);
        this.name = name;
        this.hasOwnScope = true;
        args.forEach(x => this.scope.locals.set(x.name, x.value_type));
        this.args = args;
    }

    toString = () => `fn ${this.name}`;

    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if (this._ir_block) return this._ir_block;

        if (this.body) {
            const statements: IRStatement[] = [];

            statements.push(new IRSomethingElse(`define ${this.value_type.toIR()} @${this.name}(${this.args.map(x => x.value_type.toIR() + " %__arg_" + x.name)}) {`));

            this.args.forEach(x => {
                statements.push(new IRAlloca({ type: new IRPointerType(x.value_type.toIR()), location: new IRNamedIdentifier(`%${x.name}`) }));
                statements.push(new IRStore(
                    { type: x.value_type.toIR(), location: new IRNamedIdentifier(`%__arg_${x.name}`) },
                    { type: new IRPointerType(x.value_type.toIR()), location: new IRNamedIdentifier(`%${x.name}`) }
                ));
            })

            statements.push(...flattenBlock(this.body.synthesize()));

            statements.push(new IRSomethingElse("}"));

            console.error(statements);
            return { output_location: undefined, statements: statements };
        } else {
            return { output_location: undefined, statements: [
                new IRSomethingElse(`declare ${this.return_type_literal.value_type.toIR()} @${this.name}(${this.args.map(x => x.value_type.toIR())})`)
            ]};
        }
    }
}
