import { FQN } from "../ast/FQN";
import { Type } from "./Type";


export class StructureType extends Type {
    fqn: FQN;
    fields: Map<string, Type> = new Map();
    generic_map: Map<string, Type>;

    constructor(fqn: FQN) {
        super();
        this.fqn = fqn;
    }

    toString() {
        const f: string[] = [];
        this.fields.forEach((v, k) => {
            f.push(`${k}: ${v}`);
        });
        const generics: string[] = [];
        if (this.generic_map) {
            this.generic_map.forEach((v, k) => generics.push(`${k} = ${v}`));
        }
        if (process.env.HOWL_LOG_FULL_STRUCTS) {
            return `${this.fqn.toString()}<${generics.join(", ")}>{ ${f.join(", ")} }`;
        } else {
            return `${this.fqn.toString()}<${generics.join(", ")}>{ ${[...this.fields.keys()].join(", ")} }`;
        }
    }

    equals(other: Type) {
        if (other instanceof StructureType) {
            if (!this.fqn.equals(other.fqn))
                return false;
            if (this.fields.size != other.fields.size)
                return false;

            let rc = true;
            this.fields.forEach((v, k) => {
                if (!v.equals(other.fields.get(k)))
                    rc = false;
            });
            return rc;
        }
        return false;
    }
}
