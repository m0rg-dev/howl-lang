import { ApplyPass } from "../parser/Parser";
import { ParseArgumentList } from "../parser/rules/ParseArgumentList";
import { PartialElement } from "./ASTElement";
import { TypedItemElement } from "./TypedItemElement";

export class PartialArgumentListElement extends PartialElement {
    toString() {
        return `PartialArgumentList(${this.body.map(x => x.toString()).join(" ")})`;
    }

    parse(): TypedItemElement[] {
        const parsed = ApplyPass(this.body, ParseArgumentList)[0];
        return parsed.filter(x => x instanceof TypedItemElement) as TypedItemElement[];
    }
}
