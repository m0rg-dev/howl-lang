import { ASTElement, SourceLocation } from "./ASTElement";

export abstract class ExpressionElement extends ASTElement { }

export class NameExpression extends ExpressionElement {
    name: string;

    constructor(loc: SourceLocation, name: string) {
        super(loc);
        this.name = name;
    }

    toString() {
        return `\$${this.name}`;
    }

    clone() {
        return new NameExpression(this.source_location, this.name);
    }
}

export class NumberExpression extends ExpressionElement {
    value: number;

    constructor(loc: SourceLocation, value: number) {
        super(loc);
        this.value = value;
    }

    toString() {
        return `#${this.value}`;
    }

    clone() {
        return new NumberExpression(this.source_location, this.value);
    }
}

export class FieldReferenceExpression extends ExpressionElement {
    source: ExpressionElement;
    name: string;

    constructor(loc: SourceLocation, source: ExpressionElement, name: string) {
        super(loc);
        this.source = source;
        this.name = name;
    }

    toString() {
        return `${this.source}.${this.name}`;
    }

    clone() {
        return new FieldReferenceExpression(this.source_location, this.source.clone() as ExpressionElement, this.name);
    }
}

export class FunctionCallExpression extends ExpressionElement {
    source: ExpressionElement;
    args: ExpressionElement[];

    constructor(loc: SourceLocation, source: ExpressionElement, args: ExpressionElement[]) {
        super(loc);
        this.source = source;
        this.args = [...args];
    }

    toString() {
        return `${this.source}(${this.args.map(x => x.toString()).join(", ")})`;
    }

    clone() {
        return new FunctionCallExpression(
            this.source_location,
            this.source.clone() as ExpressionElement,
            this.args.map(x => x.clone()) as ExpressionElement[]
        );
    }
}

export class ConstructorCallExpression extends ExpressionElement {
    source: number;
    args: ExpressionElement[];

    constructor(loc: SourceLocation, source: number, args: ExpressionElement[]) {
        super(loc);
        this.source = source;
        this.args = [...args];
    }

    toString() {
        return `new ${this.source}(${this.args.map(x => x.toString()).join(", ")})`;
    }

    clone() {
        return new ConstructorCallExpression(
            this.source_location,
            this.source,
            this.args.map(x => x.clone()) as ExpressionElement[]
        );
    }
}