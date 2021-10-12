import { ClassElement } from "../ast/ClassElement";
import { FQN } from "../ast/FQN";
import { FunctionElement } from "../ast/FunctionElement";
import { PartialFunctionElement } from "../ast/PartialFunctionElement";

export var TypeNames: Set<string> = new Set();
export var PartialFunctions: Set<PartialFunctionElement> = new Set();
export var Functions: Set<FunctionElement> = new Set();
export var Classes: Map<string, ClassElement> = new Map();
export var SeenFiles: Set<string> = new Set();

export var BaseTypes: Set<string> = new Set();

export function InitRegistry() {
    BaseTypes.add("i8");
    BaseTypes.add("i16");
    BaseTypes.add("i32");
    BaseTypes.add("i64");
    BaseTypes.add("u8");
    BaseTypes.add("u16");
    BaseTypes.add("u32");
    BaseTypes.add("u64");
    BaseTypes.add("void");
    BaseTypes.add("any");

    BaseTypes.forEach(x => TypeNames.add(x));
}

export var CurrentModule: FQN;

export function SetCurrentModule(m: FQN) {
    CurrentModule = m;
}

export var old_CurrentNamespace: string;

export function SetCurrentNamespace(ns: string) {
    old_CurrentNamespace = ns;
}

var NamespaceStack: string[] = [];
export function PushNamespace(ns: string) {
    NamespaceStack.push(ns);
}

export function CurrentNamespace(): string {
    return NamespaceStack.join(".");
}

export function PopNamespace() {
    NamespaceStack.pop();
}

export var SearchPath: string[] = [];