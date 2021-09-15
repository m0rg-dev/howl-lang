import { TypeBox } from "../unified_parser/TypeObject";
import { TypeConstraint } from "./Signature";

export interface Specifiable {
    addConstraint(port: string, constraint: TypeConstraint): void;
    getConstraint(port: string): TypeConstraint;
    getTarget(port: string): TypeBox;
    getAllPorts(): string[];
    nextConstraintName(): string;
}

export function isSpecifiable(x: any): x is Specifiable {
    return (typeof x == "object") && "addConstraint" in x;
}