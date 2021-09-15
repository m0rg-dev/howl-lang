import { TemplateType } from "../unified_parser/TypeObject";
import { PortConstraint, TypeConstraint } from "./Signature";

export interface Specifiable {
    addConstraint(port: string, constraint: TypeConstraint): void;
    replaceConstraint(port: string, constraint: TypeConstraint): void;
    getConstraint(port: string): TypeConstraint;
    removeConstraint(port: string): void;
    getTarget(port: string): TemplateType;
    merge(into: string, from: string): void;
    getAllPorts(): string[];
    addBound(bound: PortConstraint): void;
    getAllBounds(): PortConstraint[];
}

export function isSpecifiable(x: any): x is Specifiable {
    return (typeof x == "object") && "addConstraint" in x;
}

var cn_idx = 0;
export function nextConstraintName(): string {
    return `T${cn_idx++}`;
}