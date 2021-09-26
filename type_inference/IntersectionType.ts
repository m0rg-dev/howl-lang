import { AnyType } from "./AnyType";
import { UnionType } from "./UnionType";
import { UnitType } from "./UnitType";
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
        if (t0.equals(t1))
            return true;
        if (t0 instanceof AnyType || t1 instanceof AnyType)
            return true;
        if (t0 instanceof UnitType && t1 instanceof UnitType)
            return true;
        if (t0 instanceof UnionType || t1 instanceof UnionType) {
            let u: UnionType;
            let other: Type;
            if (t0 instanceof UnionType)
                [u, other] = [t0, t1];
            if (t1 instanceof UnionType)
                [u, other] = [t1, t0];
            if (other instanceof UnitType && u.subtypes.every(x => x instanceof UnitType))
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

            if (t0 instanceof UnitType && t1 instanceof UnitType) {
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
                if (other instanceof UnitType) {
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
