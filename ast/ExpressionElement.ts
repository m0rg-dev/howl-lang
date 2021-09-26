import { TypeLocation } from "../type_inference/TypeLocation";
import { ASTElement } from "./ASTElement";

export abstract class ExpressionElement extends ASTElement {
    type: TypeLocation;
}

