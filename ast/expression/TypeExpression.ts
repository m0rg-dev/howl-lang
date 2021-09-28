import { Type } from "../../type_inference/Type";
import { SourceLocation } from "../ASTElement";
import { ExpressionElement } from "../ExpressionElement";


export class TypeExpression extends ExpressionElement {
    source: Type;

    constructor(loc: SourceLocation, source: Type) {
        super(loc);
        this.source = source;
    }

    toString() {
        return `%${this.source}`;
    }

    clone() {
        return new TypeExpression(this.source_location, this.source);
    }
}
