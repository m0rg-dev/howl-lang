import { makeConcrete } from "../../transform/RunTransforms";
import { ConcreteType } from "../../type_inference/ConcreteType";
import { Type } from "../../type_inference/Type";
import { SourceLocation } from "../ASTElement";
import { ExpressionElement } from "../ExpressionElement";

export class CastExpression extends ExpressionElement {
    source: ExpressionElement;
    cast_to: ConcreteType;

    constructor(loc: SourceLocation, source: ExpressionElement, cast_to: ConcreteType) {
        super(loc);
        this.source = source;
        this.cast_to = cast_to;
        this.resolved_type = cast_to;
    }

    toString() {
        return `(${this.source} as ${this.cast_to})`;
    }

    clone() {
        return new CastExpression(this.source_location, this.source.clone() as ExpressionElement, this.cast_to);
    }

    static fromExpression(source: ExpressionElement, cast_to: Type) {
        return new CastExpression(source.source_location, source, makeConcrete(cast_to));
    }
}