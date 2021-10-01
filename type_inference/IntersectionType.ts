import { AnyType } from "./AnyType";
import { UnionType } from "./UnionType";
import { ConcreteType } from "./ConcreteType";
import { VoidType } from "./VoidType";
import { ClosureType, Type } from "./Type";
import { TypeLocation } from "./TypeLocation";


export class IntersectionType extends ClosureType {
    source0: TypeLocation;
    source1: TypeLocation;

    constructor(source0: TypeLocation, source1: TypeLocation) {
        super();
        this.source0 = source0;
        this.source1 = source1;
    }

    evaluable() {
        const t0 = this.source0.get();
        const t1 = this.source1.get();
        if (!t0) return false;
        if (!t1) return false;

        if (t0.equals(t1))
            return true;
        if (t0 instanceof AnyType || t1 instanceof AnyType)
            return true;
        if (t0 instanceof ConcreteType && t1 instanceof ConcreteType)
            return true;
        if (t0 instanceof UnionType || t1 instanceof UnionType) {
            let u: UnionType;
            let other: Type;
            if (t0 instanceof UnionType)
                [u, other] = [t0, t1];
            if (t1 instanceof UnionType)
                [u, other] = [t1, t0];
            if (other instanceof ConcreteType && u.subtypes.every(x => x instanceof ConcreteType))
                return true;
        }
        return false;
    }

    evaluator() {
        return () => {
            const t0 = this.source0.get();
            const t1 = this.source1.get();
            if (t0.equals(t1))
                return t0;
            if (t0 instanceof AnyType)
                return t1;
            if (t1 instanceof AnyType)
                return t0;

            if (t0 instanceof ConcreteType && t1 instanceof ConcreteType) {
                if (t0.equals(t1)) {
                    return t0;
                } else {
                    return new VoidType();
                }
            }

            if (t0 instanceof UnionType || t1 instanceof UnionType) {
                let u: UnionType;
                let other: Type;
                if (t0 instanceof UnionType)
                    [u, other] = [t0, t1];
                if (t1 instanceof UnionType)
                    [u, other] = [t1, t0];
                if (other instanceof ConcreteType) {
                    if (u.subtypes.some(x => x.equals(other)))
                        return other;
                } else {
                    return new VoidType();
                }
            }

            return new VoidType();
        };
    }

    toString() {
        return `${this.source0} ∩ ${this.source1}`;
    }

    equals(other: Type) { return false; }
}
