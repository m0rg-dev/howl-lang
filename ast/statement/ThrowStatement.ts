import { SourceLocation } from "../ASTElement";
import { ExpressionElement } from "../ExpressionElement";
import { StatementElement } from "../StatementElement";


export class ThrowStatement extends StatementElement {
    source: ExpressionElement;

    constructor(loc: SourceLocation, source: ExpressionElement) {
        super(loc);
        this.source = source;
    }

    clone() {
        return new ThrowStatement(
            this.source_location,
            this.source.clone() as ExpressionElement
        );
    }

    toString() {
        return `throw ${this.source};`;
    }
}
