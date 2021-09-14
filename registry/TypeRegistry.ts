import { BaseType, TypeObject, UnionType } from "../unified_parser/TypeObject";
import { UnknownType } from "../unified_parser/UnknownType";

export const TypeRegistry = new Map<string, TypeObject>();

export function init_types() {
    TypeRegistry.set("i8", new BaseType("i8"));
    TypeRegistry.set("i32", new BaseType("i32"));
    TypeRegistry.set("i64", new BaseType("i64"));
    TypeRegistry.set("void", new BaseType("void"));
    TypeRegistry.set("_numeric_constant", new UnionType(
        TypeRegistry.get("i64"),
        TypeRegistry.get("i32"),
        TypeRegistry.get("i8")
    ));
    TypeRegistry.set("_unknown", new UnknownType());
}