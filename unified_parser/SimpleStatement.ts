import { ASTElement, TokenStream, VoidElement } from "./ASTElement";
import { AssignmentExpression, UnaryReturnExpression } from "./Parser";

export class SimpleStatement extends VoidElement {
    source: TokenStream;
    constructor(source: TokenStream) {
        super();
        this.source = source;
    }
    toString = () => `SimpleStatement`;
}

export class AssignmentStatement extends VoidElement {
    expression: AssignmentExpression;
    constructor(expression: AssignmentExpression) {
        super();
        this.expression = expression;
    }

    toString = () => `AssignmentStatement`;
}

export class UnaryReturnStatement extends VoidElement {
    expression: UnaryReturnExpression;
    constructor(expression: UnaryReturnExpression) {
        super();
        this.expression = expression;
    }

    toString = () => `UnaryReturnStatement`;
}
