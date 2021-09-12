import { Type } from "../generator/TypeRegistry";

export interface Scope {
    lookup_symbol(symbol: string): Type;
    register_local(name: string, type: Type): void;
    current_return(): Type;
}
