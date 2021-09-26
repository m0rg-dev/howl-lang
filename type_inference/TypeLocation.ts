import { Scope } from "./Scope";
import { Type } from "./Type";


export class TypeLocation {
    location: Scope;
    index: number;

    constructor(location: Scope, index: number) {
        this.location = location;
        this.index = index;
    }

    toString() {
        return `${this.index}@${this.location.n}`;
    }

    get(): Type {
        return this.location.types[this.index];
    }
}
