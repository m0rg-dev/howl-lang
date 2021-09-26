import { Type } from "./Type";


export class ConsumedType extends Type {
    toString() { return "-"; }
    equals() { return false; }
}
