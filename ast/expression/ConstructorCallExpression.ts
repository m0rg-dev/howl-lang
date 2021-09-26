import { StructureType } from "../../type_inference/StructureType";
import { SourceLocation } from "../ASTElement";
import { ExpressionElement } from "../ExpressionElement";


export class ConstructorCallExpression extends ExpressionElement {
    source: StructureType;
    args: ExpressionElement[];

    constructor(loc: SourceLocation, source: StructureType, args: ExpressionElement[]) {
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
