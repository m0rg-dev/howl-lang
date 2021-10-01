import { ASTElement } from "../ast/ASTElement";
import { ModuleDefinitionElement } from "../ast/ModuleDefinitionElement";
import { PartialClassElement } from "../ast/PartialClassElement";
import { TokenElement } from "../ast/TokenElement";
import { NameToken } from "../lexer/NameToken";
import { TokenType } from "../lexer/TokenType";
import { Hug, InOrder, MatchToken, Optional } from "../parser/Matcher";
import { LocationFrom } from "../parser/Parser";
import { Errors } from "./Errors";
import { LogLevel, Pass } from "./Pass";

export class FindModuleNamePass extends Pass {
    apply() {
        // Files must start with a module definition.
        this.ApplySingleProductionRule({
            name: "ModuleDefinition",
            match: InOrder(
                MatchToken(TokenType.Module),
                MatchToken(TokenType.Name),
                MatchToken(TokenType.Semicolon)
            ),
            replace: (ast_stream: [any, TokenElement<NameToken>, any]) => {
                return [new ModuleDefinitionElement(LocationFrom(ast_stream), ast_stream[1].token.name)];
            }
        });

        if (this.cu.ast_stream[0] instanceof ModuleDefinitionElement) {
            this.log(LogLevel.INFO, `Identified module name: ${this.cu.ast_stream[0].getFQN()}`, LocationFrom([this.cu.ast_stream[0]]));
            this.cu.module = this.cu.ast_stream[0];
        } else {
            // If we don't have a module definition, we can't meaningfully compile the rest of the file.
            this.emitCompilationError(Errors.EXPECTED_MODULE, `Expected 'module <NAME>;' at beginning of file`, LocationFrom([this.cu.ast_stream[0]]));
        }
    }
}
