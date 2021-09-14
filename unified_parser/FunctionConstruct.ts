import { flattenBlock, IRAlloca, IRBlock, IRLoad, IRNamedIdentifier, IRPointerType, IRSomethingElse, IRStatement, IRStore, isSynthesizable, Synthesizable } from "../generator/IR";
import { VoidElement } from "./ASTElement";
import { UnresolvedTypeLiteral, TypeLiteral, ArgumentDefinition } from "./Parser";
import { CompoundStatement } from "./CompoundStatement";


export class FunctionConstruct extends VoidElement implements Synthesizable {
    name: string;
    return_type_literal: UnresolvedTypeLiteral | TypeLiteral;
    args: ArgumentDefinition[] = [];
    body?: CompoundStatement;
    constructor(name: string) {
        super();
        this.name = name;
    }

    toString = () => `Function<${this.return_type_literal?.value_type.toString()}>(${this.name})`;

    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if (this._ir_block) return this._ir_block;

        if (this.body) {
            const statements: IRStatement[] = [];

            statements.push(new IRSomethingElse(`define ${this.return_type_literal.value_type.toIR()} @${this.name}(${this.args.map(x => x.type_literal.value_type.toIR() + " %__arg_" + x.name)}) {`));

            this.args.forEach(x => {
                statements.push(new IRAlloca({ type: new IRPointerType(x.type_literal.value_type.toIR()), location: new IRNamedIdentifier(`%${x.name}`) }));
                statements.push(new IRStore(
                    { type: x.type_literal.value_type.toIR(), location: new IRNamedIdentifier(`%__arg_${x.name}`) },
                    { type: new IRPointerType(x.type_literal.value_type.toIR()), location: new IRNamedIdentifier(`%${x.name}`) }
                ));
            })

            statements.push(...flattenBlock(this.body.synthesize()));

            statements.push(new IRSomethingElse("}"));

            console.error(statements);
            return { output_location: undefined, statements: statements };
        } else {
            return { output_location: undefined, statements: [
                new IRSomethingElse(`declare ${this.return_type_literal.value_type.toIR()} @${this.name}(${this.args.map(x => x.type_literal.value_type.toIR())})`)
            ]};
        }
    }
}
