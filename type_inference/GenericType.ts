import { Type } from "./Type";


export class GenericType extends Type {
    name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    toString() { return "(" + this.name + ")"; }
    equals() { return false; }
}
