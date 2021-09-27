import { StructureType } from "./StructureType";
import { ClosureType, Type } from "./Type";
import { TypeLocation } from "./TypeLocation";


export class FieldReferenceType extends ClosureType {
    source: TypeLocation;
    field: string;

    constructor(source: TypeLocation, field: string) {
        super();
        this.source = source;
        this.field = field;
    }

    toString() {
        return `${this.source}.${this.field}`;
    }

    equals(other: Type) {
        if (!(other instanceof FieldReferenceType))
            return false;
        if (this.field != other.field)
            return false;
        return this.source.get().equals(other.source.get());
    }

    evaluable() {
        return this.source.get() instanceof StructureType;
    }

    evaluator() {
        return () => {
            return (this.source.get() as StructureType).getFieldType(this.field);
        };
    }
}
