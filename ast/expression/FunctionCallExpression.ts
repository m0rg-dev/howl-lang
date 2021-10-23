import { SourceLocation } from "../ASTElement";
import { ExpressionElement } from "../ExpressionElement";


export class FunctionCallExpression<T extends ExpressionElement> extends ExpressionElement {
    source: T;
    args: ExpressionElement[];

    constructor(loc: SourceLocation, source: T, args: ExpressionElement[]) {
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
