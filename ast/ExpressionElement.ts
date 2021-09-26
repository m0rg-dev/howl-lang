import { TypeLocation } from "../type_inference/TypeLocation";
import { UnitType } from "../type_inference/UnitType";
import { ASTElement } from "./ASTElement";

export abstract class ExpressionElement extends ASTElement {
    type_location: TypeLocation;
    resolved_type: UnitType;
}

