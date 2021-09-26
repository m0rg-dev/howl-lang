import { NameElement } from "../../ast/NameElement";
import { TypedItemElement } from "../../ast/TypedItemElement";
import { TypeElement } from "../../ast/TypeElement";
import { InOrder, MatchElementType } from "../Matcher";
import { LocationFrom, RuleList } from "../Parser";
import { MatchType } from "./MatchUtils";

export const ParseArgumentList: RuleList = {
    name: "ParseArgumentList",
    rules: [
        {
            name: "ParseArgument",
            match: InOrder(MatchType(), MatchElementType("NameElement")),
            replace: (ast_stream: [TypeElement, NameElement]) => {
                return [new TypedItemElement(LocationFrom(ast_stream), ast_stream[1].name, ast_stream[0].asTypeObject())];
            }
        }
    ]
}