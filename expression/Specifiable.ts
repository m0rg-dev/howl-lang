import { Type } from "../generator/TypeRegistry";
import { Expression } from "../expression/Expression";


export interface Specifiable {
    specify(target: Type): Expression;
}
export function isSpecifiable(obj: Object): obj is Specifiable {
    return "specify" in obj;
}
