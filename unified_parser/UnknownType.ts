import { TypeObject } from "./TypeObject";

export class UnknownType extends TypeObject {
    walk() { }
    toString = () => `UNKNOWN`;
    toIR = () => `%UNKNOWN`;
}
