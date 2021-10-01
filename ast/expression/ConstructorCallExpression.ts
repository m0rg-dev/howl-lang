import { StructureType } from "../../type_inference/StructureType";
import { SourceLocation } from "../ASTElement";
import { ExpressionElement } from "../ExpressionElement";
import { TypeExpression } from "./TypeExpression";


export class ConstructorCallExpression extends ExpressionElement {
    source: TypeExpression;
    args: ExpressionElement[];

    constructor(loc: SourceLocation, source: TypeExpression, args: ExpressionElement[]) {
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
