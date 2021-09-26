import { SourceLocation } from "../ASTElement";
import { ExpressionElement } from "../ExpressionElement";


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
