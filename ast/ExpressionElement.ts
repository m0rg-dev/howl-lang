import { TypeLocation } from "../type_inference/TypeLocation";
import { ConcreteType } from "../type_inference/ConcreteType";
import { ASTElement } from "./ASTElement";

export abstract class ExpressionElement extends ASTElement {
    type_location: TypeLocation;
    resolved_type: ConcreteType;
}

