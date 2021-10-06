import { SourceLocation } from "../ASTElement";
import { ExpressionElement } from "../ExpressionElement";
import { StatementElement } from "../StatementElement";
import { TypeElement } from "../TypeElement";


export class LocalDefinitionStatement extends StatementElement {
    name: string;
    type: TypeElement;
    initializer: ExpressionElement;

    constructor(loc: SourceLocation, name: string, type: TypeElement, initializer: ExpressionElement) {
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
