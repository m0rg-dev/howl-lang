import { BaseType, TypeObject, UnionType } from "../unified_parser/TypeObject";
import { UnresolvedType } from "../unified_parser/UnknownType";

export const TypeRegistry = new Map<string, TypeObject>();

export function init_types() {
    TypeRegistry.set("bool", new BaseType("i1")),
    TypeRegistry.set("i8", new BaseType("i8"));
    TypeRegistry.set("i32", new BaseType("i32"));
    TypeRegistry.set("i64", new BaseType("i64"));
    TypeRegistry.set("void", new BaseType("void"));
    TypeRegistry.set("_numeric_constant", new UnionType(
        TypeRegistry.get("i64"),
        TypeRegistry.get("i32"),
        TypeRegistry.get("i8"),
        TypeRegistry.get("bool")
    ));
}

export function GetType(name: string): TypeObject {
    if(TypeRegistry.has(name)) return TypeRegistry.get(name);
    const unk = new UnresolvedType(name);
    TypeRegistry.set(name, unk);
    return unk;
}

export function IsType(name: string): boolean {
    return TypeRegistry.has(name);
}

export function RegisterType(name: string, type: TypeObject) {
    TypeRegistry.set(name, type);
}

export function DeregisterType(name: string) {
    TypeRegistry.delete(name);
}
