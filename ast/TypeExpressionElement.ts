import { ASTElement, SourceLocation } from "./ASTElement";

export abstract class TypeExpressionElement extends ASTElement { }

export class TypeLiteralElement extends TypeExpressionElement {
    name: string;

    constructor(loc: SourceLocation, name: string) {
        super(loc);
        this.name = name;
    }

    toString() {
        return `'${this.name}`;
    }

    clone() {
        return new TypeLiteralElement(this.source_location, this.name);
    }
}

export class TypeIndexElement extends TypeExpressionElement {
    source: number;
    index: number;

    constructor(loc: SourceLocation, source: number, index: number) {
        super(loc);
        this.source = source;
        this.index = index;
    }

    toString() {
        return `${this.source}[${this.index}]`;
    }

    clone() {
        return new TypeIndexElement(this.source_location, this.source, this.index);
    }
}