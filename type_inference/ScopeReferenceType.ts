import { ConcreteType } from "./ConcreteType";
import { ClosureType, Type } from "./Type";
import { TypeLocation } from "./TypeLocation";


export class ScopeReferenceType extends ClosureType {
    source: TypeLocation;

    constructor(source: TypeLocation) {
        super();
        this.source = source;
    }

    evaluable() {
        return (this.source.get() instanceof ConcreteType);
    }

    evaluator() {
        return () => this.source.get();
    }

    toString() {
        return `&${this.source}`;
    }

    equals(other: Type) { return false; }
}
