import { Classes } from "../registry/Registry";
import { ConcreteType } from "../type_inference/ConcreteType";
import { FunctionType } from "../type_inference/FunctionType";
import { StructureType } from "../type_inference/StructureType";
import { ASTElement, SourceLocation } from "./ASTElement";
import { FunctionElement, OverloadedFunctionElement } from "./FunctionElement";
import { TypedItemElement } from "./TypedItemElement";

export class ClassElement extends ASTElement {
    name: string;
    parent: string;
    interfaces: string[];

    fields: TypedItemElement[];
    methods: FunctionElement[];
    generics: string[];
    is_monomorphization = false;
    is_interface: boolean;
    methods_overloaded = new Set<string>();
    overload_sets = new Map<string, string[]>();

    constructor(loc: SourceLocation, name: string, fields: TypedItemElement[], methods: FunctionElement[], generics: string[], parent: string, interfaces: string[], is_interface: boolean) {
        super(loc);
        this.name = name;
        this.fields = fields;
        this.methods = methods;
        this.generics = generics;
        this.parent = parent;
        this.interfaces = interfaces;
        this.is_interface = is_interface;

        const method_names = new Set<string>();
        methods.forEach(m => {
            if (method_names.has(m.name)) {
                this.methods_overloaded.add(m.name);
            } else {
                method_names.add(m.name);
            }
        });

        this.methods_overloaded.forEach(name => {
            this.methods.push(OverloadedFunctionElement.make(this.methods.filter(x => x.name == name)[0]));
            this.overload_sets.set(name, []);
            this.methods.filter(x => x.name == name).forEach(m => {
                if (m instanceof OverloadedFunctionElement) return;
                m.name += "__Z" + m.args.map(x => {
                    if (x.type instanceof ConcreteType) {
                        return x.type.name.replaceAll(".", "_");
                    } else {
                        return x.toString();
                    }
                }).join("_");
                this.overload_sets.get(name).push(m.name);
            });
        })

        if (!generics.length) this.is_monomorphization = true;
    }

    dropBaseMethods() {
        this.methods = this.methods.filter(m => !this.methods_overloaded.has(m.name));
    }

    toString() {
        return `${this.is_interface ? "Interface" : "Class"}<${this.generics.join(", ")}>(${this.name})${this.parent ? ` extends ${this.parent}` : ""}${this.interfaces.map(x => ` implements ${x}`)}`;
    }

    clone() {
        return new ClassElement(
            this.source_location,
            this.name,
            this.fields.map(x => x.clone()),
            this.methods.map(x => x.clone()),
            [...this.generics],
            this.parent,
            [...this.interfaces],
            this.is_interface
        );
    }

    private addFieldsToType(t: StructureType) {
        this.fields.forEach((x) => t.addField(x.name, x.type));
        this.methods.forEach((x) => t.addField(x.name, new FunctionType(x)));
    }

    type(): StructureType {
        const t = new StructureType(this.name, new Set(this.generics));
        if (this.parent) {
            if (Classes.has(this.parent)) {
                Classes.get(this.parent).addFieldsToType(t);
            } else {
                throw new Error(`no class ${this.parent}?`);
            }
        }
        this.addFieldsToType(t);
        return t;
    }

    setName(n: string) {
        this.name = n;
    }

    hierarchyIncludes(name: string): boolean {
        if (this.name == name) return true;
        if (this.interfaces.some(x => x == name)) return true;
        if (this.parent) {
            return Classes.get(this.parent).hierarchyIncludes(name);
        }
        return false;
    }

    // TODO check and make sure field names aren't aliased (but not here)
    synthesizeFields(): TypedItemElement[] {
        const rc: TypedItemElement[] = [];
        const f2 = [...this.fields];
        if (f2[0].name == "__stable") {
            rc.push(f2.shift());
        }

        if (this.parent) {
            const fp = Classes.get(this.parent).synthesizeFields();
            if (fp[0].name == "__stable") {
                fp.shift();
            }
            rc.push(...fp);
        }
        rc.push(...f2);
        return rc;
    }

    synthesizeMethods(): FunctionElement[] {
        const rc: FunctionElement[] = [];
        // this one is a little more complicated because methods CAN alias
        // but the order still matters

        if (this.parent) {
            rc.push(...Classes.get(this.parent).synthesizeMethods());
        }

        this.methods.forEach(m => {
            const idx = rc.findIndex(x => x.name.split(".").pop() == m.name.split(".").pop());
            if (idx >= 0) {
                rc[idx] = m;
            } else {
                rc.push(m);
            }
        });

        return rc;
    }
}
