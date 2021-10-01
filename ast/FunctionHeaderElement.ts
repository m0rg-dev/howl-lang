import { ASTElement, SourceLocation } from "./ASTElement";
import { TypedItemElement } from "./TypedItemElement";
import { TypeElement } from "./TypeElement";

export class FunctionHeaderElement extends ASTElement {
    name: string;
    is_static: boolean;
    returns: TypeElement;
    args: TypedItemElement[];

    constructor(loc: SourceLocation, is_static: boolean, name: string, returns: TypeElement, args: TypedItemElement[]) {
        super(loc);
        this.is_static = is_static;
        this.name = name;
        this.returns = returns;
        this.args = args;
    }

    toString() {
        return `${this.returns} ${this.name}(${this.args.join(", ")})`;
    }

    clone() {
        return new FunctionHeaderElement(
            this.source_location,
            this.is_static,
            this.name,
            this.returns.clone(),
            this.args.map(x => x.clone())
        );
    }
}
