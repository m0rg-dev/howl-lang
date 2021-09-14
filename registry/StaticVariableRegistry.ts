import { FunctionConstruct } from "../unified_parser/FunctionConstruct";
import { TypeObject } from "../unified_parser/TypeObject";

export const StaticVariableRegistry = new Map<string, { type: TypeObject, initializer?: StaticInitializer }>();
export const StaticFunctionRegistry = new Map<string, FunctionConstruct>();

export class StaticInitializer { };
