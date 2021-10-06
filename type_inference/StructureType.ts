import { ClassElement } from "../ast/ClassElement";
import { FunctionElement } from "../ast/FunctionElement";
import { TypedItemElement } from "../ast/TypedItemElement";
import { WalkAST } from "../ast/WalkAST";
import { log } from "../driver/Driver";
import { LogLevel } from "../driver/Pass";
import { Classes } from "../registry/Registry";
import { RunFunctionTransforms } from "../transform/RunTransforms";
import { AnyType } from "./AnyType";
import { ConcreteType } from "./ConcreteType";
import { FunctionType } from "./FunctionType";
import { GenericType } from "./GenericType";
import { RawPointerType, Type } from "./Type";


export class StructureType extends Type {
    name: string;
    private fields: Map<string, Type> = new Map();
    generic_map: Map<string, Type> = new Map();

    constructor(name: string, generics: Set<string>) {
        super();
        this.name = name;
        generics.forEach((x) => this.generic_map.set(x, new GenericType(x)));
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
        return `${this.name}<${generics.join(", ")}>`;
    }

    equals(other: Type) {
        if (other instanceof StructureType) {
            if (!(this.name == other.name))
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

    addField(name: string, type: Type) {
        this.fields.set(name, type);
    }

    getFieldType(field: string): Type {
        log(LogLevel.TRACE, `${this}`, `  (GetType ${field})`);
        if (field == "__stable") {
            return new StaticTableType(Classes.get(this.name));
        }
        const rc = this.applyGenericMap(this.fields.get(field));
        log(LogLevel.TRACE, `${this}`, `  (ApplyGenericMap ${rc})`);
        return rc;
    }

    applyGenericMap(t: Type): Type {
        if (t instanceof GenericType) {
            const rc = this.generic_map.get(t.name) || new AnyType();
            log(LogLevel.TRACE, `${this}`, `   (ApplyGenericMap) ${t} -> ${rc}`);
            return rc;
        } else if (t instanceof FunctionType) {
            log(LogLevel.TRACE, `${this}`, `   (ApplyGenericMap) ${t}`);
            const u = new FunctionType(t);
            u.return_type = this.applyGenericMap(t.return_type);
            u.self_type = this.applyGenericMap(t.self_type);
            u.args = u.args.map(x => this.applyGenericMap(x));
            return u;
        } else if (t instanceof StructureType) {
            // TODO don't mutate here it's weird
            if (t.name == this.name) {
                t.generic_map = this.generic_map;
            } else {
                t.generic_map.forEach((v, k) => {
                    t.generic_map.set(k, this.applyGenericMap(v));
                });
            }
            return t;
        } else if (t instanceof RawPointerType) {
            const u = new RawPointerType(this.applyGenericMap(t.source));
            return u;
        } else {
            return t;
        }
    }

    MonomorphizedName(): string {
        const generic_keys = [...this.generic_map.keys()];
        const parts = this.name.split(".");
        parts[parts.length - 1] = "M" + parts[parts.length - 1];
        return `${parts.join(".")}_${generic_keys.map(x => (this.generic_map.get(x) as ConcreteType).name).join("_")}`;
    }

    isMonomorphizable(): boolean {
        if (Classes.has(this.MonomorphizedName())) return true;
        if (Classes.get(this.name).is_monomorphization) return true;
        const generic_keys = [...this.generic_map.keys()];
        return generic_keys.every(k => this.generic_map.get(k) instanceof ConcreteType) && Classes.has(this.name) && !Classes.get(this.name).is_monomorphization;
    }

    Monomorphize(): ConcreteType {
        if (Classes.has(this.MonomorphizedName())) return new ConcreteType(this.MonomorphizedName());
        if (Classes.get(this.name).is_monomorphization) return new ConcreteType(this.name);
        const new_class = Classes.get(this.name).clone();
        new_class.is_monomorphization = true;
        new_class.setName(this.MonomorphizedName());
        // ...replace all the GenericTypes in its AST...
        WalkAST(new_class, (x, s) => {
            if (x instanceof FunctionElement) {
                x.return_type = this.applyGenericMap(x.return_type);
                x.args.forEach((arg) => {
                    arg.type = this.applyGenericMap(arg.type);
                });
                x.name = `${new_class.name.split(".").pop()}.${x.name.split(".").pop()}`;
            } else if (x instanceof TypedItemElement) {
                x.type = this.applyGenericMap(x.type);
            }
        });
        // ...and its fields...
        new_class.fields.forEach((x) => {
            x.type = this.applyGenericMap(x.type);
        });
        new_class.generics = [];
        // ...update the type of `self` on all its methods...
        new_class.methods.forEach(x => {
            x.self_type = new_class.type();
        });

        Classes.set(new_class.name, new_class);

        // ...and run type checking on the result. I might eventually
        // add support to the type checker for handling generic types
        // directly, which would let us type-check classes prior to
        // template substitution and probably result in better type
        // error handling.
        new_class.methods.forEach(RunFunctionTransforms);

        // Now, we can just treat it as a concrete type.
        return new ConcreteType(this.MonomorphizedName());
    }
}

export class StaticTableType extends ConcreteType {
    fields: Map<string, Type> = new Map();

    constructor(source: ClassElement) {
        super(`${source.name}_stable`);

        source.methods.forEach(m => {
            this.fields.set(m.getFQN().last().split(".").pop(), new FunctionType(m));
        });
    }

    toString() {
        return `${super.toString()} stable`;
    }
}