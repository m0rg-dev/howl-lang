import { ClassType } from "../../type_inference/ClassType";
import { SourceLocation } from "../ASTElement";
import { ExpressionElement } from "../ExpressionElement";


export class ConstructorCallExpression extends ExpressionElement {
    source: ClassType;
    args: ExpressionElement[];

    constructor(loc: SourceLocation, source: ClassType, args: ExpressionElement[]) {
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