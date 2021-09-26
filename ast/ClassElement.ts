import { FunctionType, StructureType } from "../type_inference/Type";
import { ASTElement, SourceLocation } from "./ASTElement";
import { FQN, HasFQN } from "./FQN";
import { FunctionElement } from "./FunctionElement";
import { ModuleDefinitionElement } from "./ModuleDefinitionElement";
import { TypedItemElement } from "./TypedItemElement";

export class ClassElement extends ASTElement implements HasFQN {
    private name: string;
    private parent: ModuleDefinitionElement;

    fields: TypedItemElement[];
    methods: FunctionElement[];
    generics: string[];

    constructor(loc: SourceLocation, parent: ModuleDefinitionElement, name: string, fields: TypedItemElement[], methods: FunctionElement[], generics: string[]) {
        super(loc);
        this.parent = parent;
        this.name = name;
        this.fields = fields;
        this.methods = methods;
        this.generics = generics;
    }

    toString() {
        return `Class<${this.generics.join(", ")}>(${this.getFQN()})`;
    }

    clone() {
        return new ClassElement(
            this.source_location,
            this.parent,
            this.name,
            this.fields.map(x => x.clone()),
            this.methods.map(x => x.clone()),
            [...this.generics]
        );
    }

    type(): StructureType {
        const t = new StructureType(this.getFQN());
        this.fields.forEach((x) => t.fields.set(x.name, x.type));
        this.methods.forEach((x) => t.fields.set(x.getFQN().last(), new FunctionType(x)));
        return t;
    }

    getFQN() {
        return new FQN(this.parent, this.name);
    }

    setName(n: string) {
        this.name = n;
    }
}
