import { ConcreteType } from "./ConcreteType";


export class VoidType extends ConcreteType {
    constructor() {
        super("void");
    }

    toString() { return "⊥"; }
    equals() { return true; }
}
