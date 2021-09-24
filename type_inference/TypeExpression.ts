import { TypeLocation } from "./Type";

export class TypeExpression { }

export class ScopeReference extends TypeExpression {
    source: TypeLocation;

    constructor(source: TypeLocation) {
        super();
        this.source = source;
    }

    toString() {
        return `&${this.source.location.n}.${this.source.index}`;
    }
}

export class FieldReferenceType extends TypeExpression {
    source: TypeExpression;
    field: string;

    constructor(source: TypeExpression, field: string) {
        super();
        this.source = source;
        this.field = field;
    }

    toString() {
        return `(${this.source}).${this.field}`;
    }
}

export class TupleIndexType extends TypeExpression {
    source: TypeExpression;
    index: number;

    constructor(source: TypeExpression, index: number) {
        super();
        this.source = source;
        this.index = index;
    }

    toString() {
        return `${this.source}[${this.index}]`;
    }
}