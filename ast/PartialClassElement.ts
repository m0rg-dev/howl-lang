import { PartialElement, SourceLocation, ASTElement } from "./ASTElement";


export class PartialClassElement extends PartialElement {
    name: string;

    constructor(loc: SourceLocation, body: ASTElement[], name: string) {
        super(loc, body);
        this.name = name;
    }

    toString() {
        return `PartialClass(${this.name})`;
    }
}
