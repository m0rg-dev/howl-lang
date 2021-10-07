import { SourceLocation } from "../ASTElement";
import { ExpressionElement } from "../ExpressionElement";


export class MacroCallExpression extends ExpressionElement {
    source: string;
    args: ExpressionElement[];

    constructor(loc: SourceLocation, source: string, args: ExpressionElement[]) {
        super(loc);
        this.source = source;
        this.args = [...args];
    }

    toString() {
        return `!${this.source}(${this.args.map(x => x.toString()).join(", ")})`;
    }

    clone() {
        return new MacroCallExpression(
            this.source_location,
            this.source,
            this.args.map(x => x.clone()) as ExpressionElement[]
        );
    }
}
