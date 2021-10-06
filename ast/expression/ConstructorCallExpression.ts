import { Type } from "../../type_inference/Type";
import { SourceLocation } from "../ASTElement";
import { ExpressionElement } from "../ExpressionElement";
import { TypeElement } from "../TypeElement";


export class ConstructorCallExpression extends ExpressionElement {
    source: TypeElement;
    args: ExpressionElement[];

    constructor(loc: SourceLocation, source: TypeElement, args: ExpressionElement[]) {
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
            this.source.clone(),
            this.args.map(x => x.clone()) as ExpressionElement[]
        );
    }
}
