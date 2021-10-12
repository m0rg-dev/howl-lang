import { Classes } from "../registry/Registry";
import { ConcreteType } from "./ConcreteType";
import { StructureType } from "./StructureType";
import { ClosureType, RawPointerType, Type } from "./Type";
import { TypeLocation } from "./TypeLocation";


export class IndexType extends ClosureType {
    source: TypeLocation;

    constructor(source: TypeLocation) {
        super();
        this.source = source;
    }

    toString() {
        return `${this.source}[]`;
    }

    equals(other: Type) {
        if (!(other instanceof IndexType))
            return false;
        return this.source.get().equals(other.source.get());
    }

    evaluable() {
        if (this.source.get() instanceof RawPointerType) return true;
        if (this.source.get() instanceof StructureType) {
            const st = this.source.get() as StructureType;
            const ct = Classes.get(st.name);
            if (ct && ct.methods.some(x => x.name == "__index__")) {
                return true;
            }
        }
        if (this.source.get() instanceof ConcreteType) {
            const ct = Classes.get((this.source.get() as ConcreteType).name);
            if (ct && ct.methods.some(x => x.name == "__index__")) {
                return true;
            }
        }
        return false;
    }

    evaluator() {
        return () => {
            const source = this.source.get();
            if (source instanceof RawPointerType) return source.source;
            if (source instanceof StructureType) {
                const ct = Classes.get(source.name);
                return source.applyGenericMap(ct.methods.find(x => x.name == "__index__")?.return_type);
            }
            if (source instanceof ConcreteType) {
                const ct = Classes.get(source.name);
                if (ct && ct.methods.some(x => x.name == "__index__")) {
                    return ct.methods.find(x => x.name == "__index__")?.return_type;
                }
            }
        };
    }
}
