import { RuleList } from "../Parser";
import { ClassRules } from "./ClassRules";
import { FunctionRules } from "./FunctionRules";
import { ModuleRules } from "./ModuleRules";

export const TopLevelParse: RuleList = {
    name: "TopLevelParse",
    rules: [
        ...ModuleRules,
        ...ClassRules,
        ...FunctionRules("module"),
    ]
};
