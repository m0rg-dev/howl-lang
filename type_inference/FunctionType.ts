import { FunctionElement } from "../ast/FunctionElement";
import { Type } from "./Type";


export class FunctionType extends Type {
    return_type: Type;
    self_type: Type;
    args: Type[];
    _propagated = false;
    is_static = false;

    constructor(source: FunctionElement | FunctionType) {
        super();
        this.return_type = source.return_type;
        this.self_type = source.self_type;
        this.is_static = source.is_static;
        if (source instanceof FunctionElement) {
            this.args = source.args.map(x => x.type.asTypeObject());
        } else {
            this.args = [...source.args];
        }
    }

    toString() {
        return `${this.self_type}.(${this.args.map(x => x.toString()).join(", ")}) => ${this.return_type}`;
    }

    equals(other: Type) { return false; }
}
