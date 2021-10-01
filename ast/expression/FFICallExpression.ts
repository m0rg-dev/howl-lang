import { SourceLocation } from "../ASTElement";
import { ExpressionElement } from "../ExpressionElement";


export class FFICallExpression extends ExpressionElement {
    source: string;
    args: ExpressionElement[];

    constructor(loc: SourceLocation, source: string, args: ExpressionElement[]) {
        super(loc);
        this.source = source;
        this.args = [...args];
    }

    toString() {
        return `fficall ${this.source}(${this.args.map(x => x.toString()).join(", ")})`;
    }

    clone() {
        return new FFICallExpression(
            this.source_location,
            this.source,
            this.args.map(x => x.clone()) as ExpressionElement[]
        );
    }
}
