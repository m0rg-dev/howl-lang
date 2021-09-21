import { PartialFunctions } from "../registry/Registry";
import { PartialElement, SourceLocation, ASTElement } from "./ASTElement";


export class PartialFunctionElement extends PartialElement {
    name: string;

    constructor(loc: SourceLocation, body: ASTElement[], name: string) {
        super(loc, body);
        this.name = name;

        PartialFunctions.add(this);
    }

    toString() {
        return `PartialFunction(${this.name})`;
    }
}
