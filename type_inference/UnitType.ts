import { Type } from "./Type";


export class UnitType extends Type {
    name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    toString() { return "'" + this.name; }
    equals(other: Type) {
        if (other instanceof UnitType)
            return other.name == this.name;
        return false;
    }
}
