import { ClassElement } from "../ast/ClassElement";
import { FunctionElement } from "../ast/FunctionElement";
import { PartialFunctionElement } from "../ast/PartialFunctionElement";

export var TypeNames: Set<string> = new Set();
export var PartialFunctions: Set<PartialFunctionElement> = new Set();
export var Functions: Set<FunctionElement> = new Set();
export var Classes: Set<ClassElement> = new Set();

export function InitRegistry() {
    TypeNames.add("i8");
    TypeNames.add("i16");
    TypeNames.add("i32");
    TypeNames.add("i64");
    TypeNames.add("void");
    TypeNames.add("any");
}
