import { FunctionElement } from "../ast/FunctionElement";
import { ConcreteType } from "./ConcreteType";
import { Type } from "./Type";


export class FunctionType extends ConcreteType {
    return_type: Type;
    self_type: Type;
    args: Type[];
    _propagated = false;
    is_static = false;

    constructor(source: FunctionElement | FunctionType) {
        super(undefined);
        this.is_static = source.is_static;
        if (source instanceof FunctionElement) {
            this.return_type = source.return_type;
            this.self_type = source.self_type;
            this.args = source.args.map(x => x.type);
        } else {
            this.return_type = source.return_type;
            this.self_type = source.self_type;
            this.args = [...source.args];
        }

        this.name = `${this.return_type}(*)(${[this.self_type, ...this.args].join(", ")})`;
    }

    toString() {
        return `${this.self_type}.(${this.args.map(x => x.toString()).join(", ")}) => ${this.return_type}`;
    }

    equals(other: Type) { return false; }
}
