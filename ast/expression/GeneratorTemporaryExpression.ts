import { ExpressionElement } from "../ExpressionElement";

export class GeneratorTemporaryExpression extends ExpressionElement {
    source: ExpressionElement;

    constructor(source: ExpressionElement) {
        super(source.source_location);
        this.source = source;
        this.resolved_type = source.resolved_type;
    }

    clone() {
        return new GeneratorTemporaryExpression(this.source);
    }

    toString() {
        return `GENEX(${this.uuid.substr(0, 4)}) ${this.source}`;
    }
}