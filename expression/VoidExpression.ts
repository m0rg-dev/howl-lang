import { TypeRegistry } from "../generator/TypeRegistry";
import { Expression } from "./Expression";


export class VoidExpression extends Expression {
    valueType = () => TypeRegistry.get("void");
    toString = () => `Void`;
    inferTypes = () => { };
}
