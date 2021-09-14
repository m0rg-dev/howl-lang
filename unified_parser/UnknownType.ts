import { TypeObject } from "./TypeObject";

export class UnknownType extends TypeObject {
    walk() { }
    toString = () => `UNKNOWN`;
    toIR = () => { throw new Error("can't IR-ify an UnknownType") };
}
