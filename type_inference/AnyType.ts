import { Type } from "./Type";


export class AnyType extends Type {
    constructor() {
        super();
    }

    toString() { return "⊤"; }
    equals() { return true; }
}
