import { SourceLocation } from "../ASTElement";
import { TypeExpression } from "../expression/TypeExpression";
import { ExpressionElement } from "../ExpressionElement";
import { StatementElement } from "../StatementElement";


export class LocalDefinitionStatement extends StatementElement {
    name: string;
    type: TypeExpression;
    initializer: ExpressionElement;

    constructor(loc: SourceLocation, name: string, type: TypeExpression, initializer: ExpressionElement) {
        super(loc);
        this.name = name;
        this.type = type;
        this.initializer = initializer;
    }

    clone() {
        return new LocalDefinitionStatement(this.source_location, this.name, this.type, this.initializer.clone() as ExpressionElement);
    }

    toString() {
        return `let ${this.type} ${this.name} = ${this.initializer};`;
    }
}
