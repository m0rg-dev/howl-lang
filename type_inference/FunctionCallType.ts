import { FunctionType } from "./FunctionType";
import { GenericType } from "./GenericType";
import { ClosureType } from "./Type";
import { TypeLocation } from "./TypeLocation";


export class FunctionCallType extends ClosureType {
    source: TypeLocation;

    constructor(source: TypeLocation) {
        super();
        this.source = source;
    }

    toString() {
        return `${this.source}()`;
    }

    equals() {
        return false;
    }

    evaluable() {
        return this.source.get() instanceof FunctionType && !((this.source.get() as FunctionType).return_type instanceof GenericType);
    }

    evaluator() {
        return () => {
            return (this.source.get() as FunctionType).return_type;
        };
    }
}
