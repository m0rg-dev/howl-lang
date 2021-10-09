import { CompilationUnit } from "../driver/CompilationUnit";
import { LocationFrom } from "../parser/Parser";
import { Type } from "../type_inference/Type";
import { ASTElement, SourceLocation } from "./ASTElement";
import { CompoundStatementElement } from "./CompoundStatementElement";
import { FunctionElement } from "./FunctionElement";
import { TypedItemElement } from "./TypedItemElement";
import { TypeElement } from "./TypeElement";

export class FunctionHeaderElement extends ASTElement {
    name: string;
    is_static: boolean;
    returns: TypeElement;
    args: TypedItemElement[];
    throws: Type[];

    constructor(loc: SourceLocation, is_static: boolean, name: string, returns: TypeElement, args: TypedItemElement[], throws: Type[]) {
        super(loc);
        this.is_static = is_static;
        this.name = name;
        this.returns = returns;
        this.args = args;
        this.throws = throws;
    }

    toString() {
        return `${this.returns} ${this.name}(${this.args.join(", ")})${this.throws.map(x => ` throws ${x}`).join(" ")}`;
    }

    clone() {
        return new FunctionHeaderElement(
            this.source_location,
            this.is_static,
            this.name,
            this.returns.clone(),
            this.args.map(x => x.clone()),
            [...this.throws]
        );
    }

    toFunction(source: CompilationUnit, body: CompoundStatementElement) {
        return new FunctionElement(
            LocationFrom([this, body]),
            source.module,
            this.name,
            this.returns.asTypeObject(),
            undefined,
            this.args,
            this.throws,
            this.is_static,
            body,
            source
        );
    }
}
