import { FunctionElement } from "../ast/FunctionElement";
import { Classes } from "../registry/Registry";
import { Scope } from "./Scope";

export class TypeLocation {
    location: Scope;
    index: number;

    constructor(location: Scope, index: number) {
        this.location = location;
        this.index = index;
    }

    toString() {
        return `${this.index}@${this.location.n}`;
    }

    get(): Type {
        return this.location.types[this.index];
    }
};

export abstract class Type {
    abstract toString(): string;
    abstract equals(other: Type): boolean;
}

export class UnitType extends Type {
    name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    toString() { return "'" + this.name; }
    equals(other: Type) {
        if (other instanceof UnitType) return other.name == this.name;
        return false;
    }
}

export class GenericType extends Type {
    name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    toString() { return "(" + this.name + ")"; }
    equals() { return false; }
}

export class VoidType extends UnitType {
    constructor() {
        super("void");
    }

    toString() { return "⊥"; }
    equals() { return true; }
}

export class ConsumedType extends Type {
    toString() { return "-"; }
    equals() { return false; }
}

export class AnyType extends Type {
    constructor() {
        super();
    }

    toString() { return "∀"; }
    equals() { return true; }
}


export class UnionType extends Type {
    subtypes: Type[];

    constructor(subtypes: Type[]) {
        super();
        this.subtypes = subtypes;
    }

    toString() { return `(${this.subtypes.map(x => x.toString()).join(" | ")})` }
    equals(other: Type) {
        if (other instanceof UnionType) {
            if (this.subtypes.length != other.subtypes.length) return false;
            let rc = true;
            this.subtypes.forEach((x, y) => {
                if (!x.equals(other.subtypes[y])) rc = false;
            });
            return rc;
        }
        return false;
    }
}

export class StructureType extends Type {
    name: string;
    fields: Map<string, Type> = new Map();
    generic_map: Map<string, Type>;

    constructor(name: string) {
        super();
        this.name = name;
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
            return `${this.name}<${generics.join(", ")}>{ ${f.join(", ")} }`;
        } else {
            return `${this.name}<${generics.join(", ")}>{ ${[...this.fields.keys()].join(", ")} }`;
        }
    }

    equals(other: Type) {
        if (other instanceof StructureType) {
            if (this.name != other.name) return false;
            if (this.fields.size != other.fields.size) return false;

            let rc = true;
            this.fields.forEach((v, k) => {
                if (!v.equals(other.fields.get(k))) rc = false;
            });
            return rc;
        }
        return false;
    }
}

export abstract class ClosureType extends Type {
    abstract evaluable(): boolean
    abstract evaluator(): () => Type;
}

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
        if (t0.equals(t1)) return true;
        if (t0 instanceof AnyType || t1 instanceof AnyType) return true;
        if (t0 instanceof UnitType && t1 instanceof UnitType) return true;
        if (t0 instanceof UnionType || t1 instanceof UnionType) {
            let u: UnionType;
            let other: Type;
            if (t0 instanceof UnionType) [u, other] = [t0, t1];
            if (t1 instanceof UnionType) [u, other] = [t1, t0];
            if (other instanceof UnitType && u.subtypes.every(x => x instanceof UnitType)) return true;
        }
        return false;
    }

    evaluator() {
        return () => {
            const t0 = this.source0.get();
            const t1 = this.source1.get();
            if (t0.equals(t1)) return t0;
            if (t0 instanceof AnyType) return t1;
            if (t1 instanceof AnyType) return t0;

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
                if (t0 instanceof UnionType) [u, other] = [t0, t1];
                if (t1 instanceof UnionType) [u, other] = [t1, t0];
                if (other instanceof UnitType) {
                    if (u.subtypes.some(x => x.equals(other))) return other;
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

export class ScopeReferenceType extends ClosureType {
    source: TypeLocation;

    constructor(source: TypeLocation) {
        super();
        this.source = source;
    }

    evaluable() {
        return (this.source.get() instanceof UnitType);
    }

    evaluator() {
        return () => this.source.get();
    }

    toString() {
        return `&${this.source}`;
    }

    equals(other: Type) { return false; }
}

export class FunctionType extends Type {
    return_type: Type;
    self_type: Type;
    args: Type[];
    _propagated = false;

    constructor(source: FunctionElement) {
        super();
        this.return_type = source.return_type;
        this.self_type = source.self_type;
        this.args = source.args.map(x => x.type);
    }

    toString() {
        return `${this.self_type}.(${this.args.map(x => x.toString()).join(", ")}) => ${this.return_type}`;
    }

    equals(other: Type) { return false; }
}

export class FieldReferenceType extends ClosureType {
    source: TypeLocation;
    field: string;

    constructor(source: TypeLocation, field: string) {
        super();
        this.source = source;
        this.field = field;
    }

    toString() {
        return `${this.source}.${this.field}`;
    }

    equals(other: Type) {
        if (!(other instanceof FieldReferenceType)) return false;
        if (this.field != other.field) return false;
        return this.source.get().equals(other.source.get());
    }

    evaluable() {
        return this.source.get() instanceof StructureType;
    }

    evaluator() {
        return () => {
            return (this.source.get() as StructureType).fields.get(this.field);
        }
    }
}

export class FunctionCallType extends ClosureType {
    source: TypeLocation;

    constructor(source: TypeLocation) {
        super();
        this.source = source;
    }

    toString() {
        return `${this.source}()`;
    }

    equals() {
        return false;
    }

    evaluable() {
        return this.source.get() instanceof FunctionType && !((this.source.get() as FunctionType).return_type instanceof GenericType);
    }

    evaluator() {
        return () => {
            return (this.source.get() as FunctionType).return_type;
        }
    }
}