import { PartialFunctionElement } from "../ast/PartialFunctionElement";

export var Types: Set<string> = new Set();
export var PartialFunctions: Set<PartialFunctionElement> = new Set();

export function InitRegistry() {
    Types.add("i8");
    Types.add("i32");
    Types.add("i64");
    Types.add("void");
    Types.add("any");
}
