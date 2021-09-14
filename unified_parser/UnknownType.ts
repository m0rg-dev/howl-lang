import { TypeObject } from "./TypeObject";

export class UnresolvedType extends TypeObject {
    name: string;
    constructor(name: string) {
        super();
        this.name = name;
    }
    walk() { }
    toString = () => `@${this.name}`;
    toIR = () => `%__unresolved_${this.name}`;
}
