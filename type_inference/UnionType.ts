import { Type } from "./Type";


export class UnionType extends Type {
    subtypes: Type[];

    constructor(subtypes: Type[]) {
        super();
        this.subtypes = subtypes;
    }

    toString() { return `(${this.subtypes.map(x => x.toString()).join(" | ")})`; }
    equals(other: Type) {
        if (other instanceof UnionType) {
            if (this.subtypes.length != other.subtypes.length)
                return false;
            let rc = true;
            this.subtypes.forEach((x, y) => {
                if (!x.equals(other.subtypes[y]))
                    rc = false;
            });
            return rc;
        }
        return false;
    }
}
