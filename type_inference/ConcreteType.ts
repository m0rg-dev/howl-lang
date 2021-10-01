import { StructureType } from "./StructureType";
import { Type } from "./Type";

export class ConcreteType extends Type {
    name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    toString() { return "'" + this.name; }
    equals(other: Type) {
        if (other instanceof ConcreteType)
            return other.name == this.name;
        return false;
    }

    ir_type() {
        return this.name;
    }
}

export class ConcreteFunctionType extends ConcreteType {
    return_type: ConcreteType;
    arg_types: ConcreteType[];

    constructor(return_type: ConcreteType, arg_types: ConcreteType[]) {
        super(`${return_type.name}(${arg_types.map(x => x.name).join(", ")})`);
        this.return_type = return_type;
        this.arg_types = arg_types;
    }
}

export class ConcreteRawPointerType extends ConcreteType {
    source_type: ConcreteType;

    constructor(source_type: ConcreteType) {
        super(`*${source_type.name}`);
        this.source_type = source_type;
    }
}

export class ConcreteStructureType extends ConcreteType {
    source_type: StructureType;

    constructor(source: StructureType, monomorphized: StructureType) {
        super(monomorphized.name);
        this.source_type = source;
    }
}