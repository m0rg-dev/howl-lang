import { RuleList } from "../Parser";
import { ClassRules } from "./ClassRules";
import { FunctionRules } from "./FunctionRules";
import { ModuleRules } from "./ModuleRules";

export function TopLevelParse(parent: string[]): RuleList {
    return {
        name: "TopLevelParse",
        rules: [
            ...ModuleRules,
            ...ClassRules(parent),
            ...FunctionRules(parent),
        ]
    };
}