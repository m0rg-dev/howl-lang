import { ApplyPass } from "../parser/Parser";
import { ParseArgumentList } from "../parser/rules/ParseArgumentList";
import { ParseTypes } from "../parser/rules/ParseType";
import { PartialElement } from "./ASTElement";
import { TypedItemElement } from "./TypedItemElement";

export class PartialArgumentListElement extends PartialElement {
    toString() {
        return `PartialArgumentList(${this.body.map(x => x.toString()).join(" ")})`;
    }

    parse(): TypedItemElement[] {
        let parsed = ApplyPass(this.body, ParseTypes)[0];
        parsed = ApplyPass(this.body, ParseArgumentList)[0];
        return parsed.filter(x => x instanceof TypedItemElement) as TypedItemElement[];
    }
}
