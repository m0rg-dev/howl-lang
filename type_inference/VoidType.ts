import { UnitType } from "./UnitType";


export class VoidType extends UnitType {
    constructor() {
        super("void");
    }

    toString() { return "⊥"; }
    equals() { return true; }
}
