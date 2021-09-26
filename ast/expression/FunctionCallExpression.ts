import { SourceLocation } from "../ASTElement";
import { ExpressionElement } from "../ExpressionElement";


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
