import { ASTElement, SourceLocation } from "./ASTElement";
import { ExpressionElement } from "./ExpressionElement";

export abstract class StatementElement extends ASTElement { }

export class PartialStatementElement extends StatementElement {
    body: ASTElement[];

    constructor(loc: SourceLocation, body: ASTElement[]) {
        super(loc);
        this.body = [...body];
    }

    clone() {
        return new PartialStatementElement(this.source_location, this.body.map(x => x.clone()) as ASTElement[]);
    }

    toString() {
        return `PartialStatement(${this.body.map(x => x.toString()).join(" ")})`;
    }
}

export class SimpleStatement extends StatementElement {
    exp: ExpressionElement;

    constructor(loc: SourceLocation, exp: ExpressionElement) {
        super(loc);
        this.exp = exp;
    }

    clone() {
        return new SimpleStatement(this.source_location, this.exp.clone() as ExpressionElement);
    }

    toString() {
        return this.exp.toString();
    }
}

export class AssignmentStatement extends StatementElement {
    lhs: ExpressionElement;
    rhs: ExpressionElement;

    constructor(loc: SourceLocation, lhs: ExpressionElement, rhs: ExpressionElement) {
        super(loc);
        this.lhs = lhs;
        this.rhs = rhs;
    }

    clone() {
        return new AssignmentStatement(this.source_location,
            this.lhs.clone() as ExpressionElement,
            this.rhs.clone() as ExpressionElement);
    }

    toString() {
        return `${this.lhs} = ${this.rhs}`;
    }
}

export class LocalDefinitionStatement extends StatementElement {
    name: string;

    constructor(loc: SourceLocation, name: string) {
        super(loc);
        this.name = name;
    }

    clone() {
        return new LocalDefinitionStatement(this.source_location, this.name);
    }

    toString() {
        return `let ${this.name}`;
    }
}

export class NullaryReturnStatement extends StatementElement {
    clone() {
        return new NullaryReturnStatement(this.source_location);
    }

    toString() {
        return `return`;
    }
}

export class UnaryReturnStatement extends StatementElement {
    source: ExpressionElement;

    constructor(loc: SourceLocation, source: ExpressionElement) {
        super(loc);
        this.source = source;
    }

    clone() {
        return new UnaryReturnStatement(
            this.source_location,
            this.source.clone() as ExpressionElement
        );
    }

    toString() {
        return `return ${this.source}`;
    }
}