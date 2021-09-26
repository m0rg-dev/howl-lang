import { Classes } from "../registry/Registry";
import { ClosureType, Type } from "./Type";


export class ClassType extends ClosureType {
    name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    evaluable() {
        return Classes.has(this.name);
    }

    evaluator() {
        return () => {
            return Classes.get(this.name).type();
        };
    }

    toString() {
        return `(Class ${this.name})`;
    }

    equals(other: Type) {
        // ClassTypes will get broken out before we need to do equality comparisons on them
        return false;
    }
}
