import { Type } from "./Type";


export class ConcreteType extends Type {
    name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    toString() { return "'" + this.name; }
    equals(other: Type) {
        if (other instanceof ConcreteType)
            return other.name == this.name;
        return false;
    }
}
