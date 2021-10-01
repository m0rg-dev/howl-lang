import { ASTElement } from "../ast/ASTElement";
import { FQN } from "../ast/FQN";
import { TokenElement } from "../ast/TokenElement";
import { NameToken } from "../lexer/NameToken";
import { TokenType } from "../lexer/TokenType";
import { AssertNegative, Hug, InOrder, MatchToken, Not, Optional, Until } from "../parser/Matcher";
import { LocationFrom, ResynchronizeTopLevel } from "../parser/Parser";
import { Errors } from "./Errors";
import { LogLevel, Pass } from "./Pass";

export class FindClassNamesPass extends Pass {
    apply() {
        // Extract well-formed (up to the body contents) class definitions.
        this.ApplySingleProductionRule({
            name: "ClassDefinition",
            match: InOrder(
                MatchToken(TokenType.Class),
                MatchToken(TokenType.Name),
                Optional(Hug(TokenType.OpenAngle)),
                Hug(TokenType.OpenBrace)
            ),
            replace: (ast_stream: [any, TokenElement<NameToken>, ...ASTElement[]]) => {
                const name = ast_stream[1].token.name;
                const fqn = new FQN(this.cu.module, name);
                this.log(LogLevel.INFO, `Found class: ${fqn}`, LocationFrom(ast_stream));
                this.cu.class_names.add(name);
                return undefined;
            }
        });

        // Look for non-well-formed class definitions.
        this.ApplySingleProductionRule({
            name: "ClassJunkBeforeBody",
            match: InOrder(
                MatchToken(TokenType.Class),
                MatchToken(TokenType.Name),
                Optional(Hug(TokenType.OpenAngle)),
                Until(MatchToken(TokenType.OpenBrace)),
                ResynchronizeTopLevel
            ),
            replace: (ast_stream: [any, TokenElement<NameToken>, ...ASTElement[]]) => {
                if (ast_stream[2] instanceof TokenElement && ast_stream[2].token.type == TokenType.OpenAngle) {
                    // get rid of the generic list, if it's OK
                    const [_, l] = Hug(TokenType.OpenAngle)(ast_stream.slice(2));
                    ast_stream.splice(2, l);
                }
                // figure out how long the junk is
                let [_, l] = Until(MatchToken(TokenType.OpenBrace))(ast_stream.slice(1));
                if (l > 0) l--; // don't include the {
                this.emitCompilationError(Errors.JUNK_BEFORE_CLASS_BODY, `Expected class body`, LocationFrom(ast_stream.slice(2, 2 + l)));
                return [];
            }
        });

        this.ApplySingleProductionRule({
            name: "ClassMissingBody",
            match: InOrder(
                MatchToken(TokenType.Class),
                MatchToken(TokenType.Name),
                Optional(Hug(TokenType.OpenAngle)),
                AssertNegative(Hug(TokenType.OpenBrace)),
                ResynchronizeTopLevel
            ),
            replace: (ast_stream: [any, TokenElement<NameToken>, ...ASTElement[]]) => {
                this.emitCompilationError(Errors.NO_CLASS_BODY, `Class body failed to parse (likely due to a missing or non-matched '}')`, LocationFrom(ast_stream.slice(2)));
                return [];
            }
        });

        this.ApplySingleProductionRule({
            name: "ClassMissingName",
            match: InOrder(
                MatchToken(TokenType.Class),
                Not(MatchToken(TokenType.Name)),
                ResynchronizeTopLevel
            ),
            replace: (ast_stream: ASTElement[]) => {
                this.emitCompilationError(Errors.EXPECTED_NAME, `Expected name`, ast_stream[1].source_location);
                return [];
            }
        });
    }
}
