import { ClassElement } from "../ast/ClassElement";
import { FQN } from "../ast/FQN";
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
        console.error(`  (GetType ${field})`);
        const rc = this.applyGenericMap(this.fields.get(field));
        console.error(`  (ApplyGenericMap ${rc})`);
        return rc;
    }

    applyGenericMap(t: Type): Type {
        if (t instanceof GenericType) {
            console.error(`   (ApplyGenericMap) ${t} -> ${this.generic_map.get(t.name)}`);
            return this.generic_map.get(t.name);
        } else if (t instanceof FunctionType) {
            console.error(`   (ApplyGenericMap) ${t}`);
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
        return `M${this.name}_${generic_keys.map(x => (this.generic_map.get(x) as ConcreteType).name).join("_")}`;
    }
}

export class StaticTableType extends StructureType {
    constructor(source: ClassElement) {
        super(`${source.name}_stable`, new Set());

        source.methods.forEach(m => {
            super.addField(m.getFQN().last(), new FunctionType(m));
        });
    }

    toString() {
        return `${super.toString()} stable`;
    }
}