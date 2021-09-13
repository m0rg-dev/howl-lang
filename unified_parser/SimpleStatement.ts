import { ASTElement, TokenStream } from "./ASTElement";
import { AssignmentExpression, UnaryReturnExpression } from "./Parser";

export class SimpleStatement extends ASTElement {
    source: TokenStream;
    constructor(source: TokenStream) {
        super();
        this.source = source;
    }
    toString = () => `SimpleStatement`;
}

export class AssignmentStatement extends ASTElement {
    expression: AssignmentExpression;
    constructor(expression: AssignmentExpression) {
        super();
        this.expression = expression;
    }

    toString = () => `AssignmentStatement`;
}

export class UnaryReturnStatement extends ASTElement {
    expression: UnaryReturnExpression;
    constructor(expression: UnaryReturnExpression) {
        super();
        this.expression = expression;
    }

    toString = () => `UnaryReturnStatement`;
}
