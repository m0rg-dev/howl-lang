import { Type } from "../generator/TypeRegistry";
import { Expression } from "./Expression";


export interface Specifiable {
    specify(target: Type): Expression;
}
export function isSpecifiable(obj: Object): obj is Specifiable {
    return "specify" in obj;
}
