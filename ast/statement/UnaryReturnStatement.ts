import { SourceLocation } from "../ASTElement";
import { ExpressionElement } from "../ExpressionElement";
import { StatementElement } from "../StatementElement";


export class UnaryReturnStatement extends StatementElement {
    source: ExpressionElement;

    constructor(loc: SourceLocation, source: ExpressionElement) {
        super(loc);
        this.source = source;
    }

    clone() {
        return new UnaryReturnStatement(
            this.source_location,
            this.source.clone() as ExpressionElement
        );
    }

    toString() {
        return `return ${this.source};`;
    }
}
