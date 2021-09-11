import { Type } from "../generator/TypeRegistry";

export interface Scope {
    lookup_symbol(symbol: string): Type;
}
