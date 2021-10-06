import { ASTElement } from "../ast/ASTElement";
import { CompoundStatementElement } from "../ast/CompoundStatementElement";
import { NameExpression } from "../ast/expression/NameExpression";
import { ExpressionElement } from "../ast/ExpressionElement";
import { AssignmentStatement } from "../ast/statement/AssignmentStatement";
import { IfStatement } from "../ast/statement/IfStatement";
import { LocalDefinitionStatement } from "../ast/statement/LocalDefinitionStatement";
import { NullaryReturnStatement } from "../ast/statement/NullaryReturnStatement";
import { SimpleStatement } from "../ast/statement/SimpleStatement";
import { UnaryReturnStatement } from "../ast/statement/UnaryReturnStatement";
import { WhileStatement } from "../ast/statement/WhileStatement";
import { TokenElement } from "../ast/TokenElement";
import { TypeElement } from "../ast/TypeElement";
import { TokenType } from "../lexer/TokenType";
import { Hug } from "../parser/Matcher";
import { LocationFrom } from "../parser/Parser";
import { CompilationUnit } from "./CompilationUnit";
import { Errors } from "./Errors";
import { LogLevel, Pass } from "./Pass";

export class StatementPass extends Pass {
    parseCompound(segment: ASTElement[]) {
        // Ad-hoc parse time, everyone!
        const s2: ASTElement[] = [];

        // drop the braces
        segment.shift();
        segment.pop();

        while (segment.length) {
            const el = segment.shift();
            if (el instanceof TokenElement) {
                if (el.token.type == TokenType.Return) {
                    // Two choices: Nullary return (return ;), unary return (return exp ;)
                    const maybe_exp = segment.shift();
                    if (maybe_exp instanceof TokenElement && maybe_exp.token.type == TokenType.Semicolon) {
                        // Nullary return.
                        s2.push(new NullaryReturnStatement(LocationFrom([el, maybe_exp])));
                    } else if (maybe_exp instanceof ExpressionElement) {
                        // Unary return. Make sure we have the ;
                        const semi = segment.shift();
                        if (semi instanceof TokenElement && semi.token.type == TokenType.Semicolon) {
                            s2.push(new UnaryReturnStatement(LocationFrom([el, maybe_exp, semi]), maybe_exp));
                        } else {
                            this.emitCompilationError(Errors.EXPECTED_SEMICOLON, "Expected semicolon", semi.source_location);
                            this.resynchronize(segment);
                        }
                    } else {
                        this.emitCompilationError(Errors.EXPECTED_EXPRESSION, "Expected expression", maybe_exp.source_location);
                        this.resynchronize(segment);
                    }
                } else if (el.token.type == TokenType.Let) {
                    // let type name = initializer;
                    const maybe_type = segment.shift();
                    if (!(maybe_type instanceof TypeElement)) {
                        this.emitCompilationError(Errors.EXPECTED_TYPE, "Expected type", maybe_type.source_location);
                        this.resynchronize(segment);
                        continue;
                    }

                    const maybe_name = segment.shift();
                    if (!(maybe_name instanceof NameExpression)) {
                        this.emitCompilationError(Errors.EXPECTED_NAME, "Expected name", maybe_name.source_location);
                        this.resynchronize(segment);
                        continue;
                    }

                    const equals = segment.shift();
                    if (!(equals instanceof TokenElement && equals.token.type == TokenType.Equals)) {
                        this.emitCompilationError(Errors.EXPECTED_EQUALS, "Expected equals sign", equals.source_location);
                        this.resynchronize(segment);
                        continue;
                    }

                    const initializer = segment.shift();
                    if (!(initializer instanceof ExpressionElement)) {
                        this.emitCompilationError(Errors.EXPECTED_EXPRESSION, "Expected expression", initializer.source_location);
                        this.resynchronize(segment);
                        continue;
                    }

                    const semi = segment.shift();
                    if (!(semi instanceof TokenElement && semi.token.type == TokenType.Semicolon)) {
                        this.emitCompilationError(Errors.EXPECTED_SEMICOLON, "Expected semicolon", semi.source_location);
                        this.resynchronize(segment);
                        continue;
                    }

                    s2.push(new LocalDefinitionStatement(LocationFrom([el, equals]), maybe_name.name, maybe_type, initializer));
                } else if (el.token.type == TokenType.If || el.token.type == TokenType.While) {
                    // if/while exp { statements }
                    const maybe_exp = segment.shift();
                    if (maybe_exp instanceof ExpressionElement) {
                        const [m, len] = Hug(TokenType.OpenBrace)(segment);
                        if (m) {
                            const substatements = segment.splice(0, len);
                            this.parseCompound(substatements);
                            const body = substatements[0] as CompoundStatementElement;
                            if (el.token.type == TokenType.If) {
                                s2.push(new IfStatement(LocationFrom([el, body]), maybe_exp, body));
                            } else {
                                s2.push(new WhileStatement(LocationFrom([el, body]), maybe_exp, body));
                            }
                        } else {
                            this.emitCompilationError(Errors.EXPECTED_OPEN_BRACE, "Expected open brace", segment[0].source_location);
                            this.resynchronize(segment);
                        }
                    } else {
                        this.emitCompilationError(Errors.EXPECTED_EXPRESSION, "Expected expression", maybe_exp.source_location);
                        this.resynchronize(segment);
                    }
                } else {
                    this.emitCompilationError(Errors.COMPILER_BUG, "Token NYI", el.source_location);
                }
            } else if (el instanceof ExpressionElement) {
                const next_element = segment.shift();
                if (next_element instanceof TokenElement) {
                    if (next_element.token.type == TokenType.Semicolon) {
                        // exp ; - SimpleStatement
                        s2.push(new SimpleStatement(LocationFrom([el, next_element]), el));
                    } else if (next_element.token.type == TokenType.Equals) {
                        const rhs = segment.shift();
                        if (rhs instanceof ExpressionElement) {
                            const semi = segment.shift();
                            if (semi instanceof TokenElement && semi.token.type == TokenType.Semicolon) {
                                s2.push(new AssignmentStatement(LocationFrom([el, semi]), el, rhs));
                            } else {
                                this.emitCompilationError(Errors.EXPECTED_SEMICOLON, "Expected semicolon", semi.source_location);
                                this.resynchronize(segment);
                            }
                        } else {
                            this.emitCompilationError(Errors.EXPECTED_EXPRESSION, "Expected expression", rhs.source_location);
                            this.resynchronize(segment);
                        }
                    } else {
                        this.emitCompilationError(Errors.COMPILER_BUG, "Token NYI", next_element.source_location);
                    }
                } else {
                    this.emitCompilationError(Errors.UNEXPECTED_EXPRESSION, "Unexpected expression", next_element.source_location);
                }
            } else {
                this.emitCompilationError(Errors.COMPILER_BUG, "Element NYI", el.source_location);
            }
        }

        this.log(LogLevel.TRACE, `${s2.map(x => x.toString()).join(" ")}`);
        segment.splice(0, segment.length, new CompoundStatementElement(LocationFrom(s2), s2));
    }

    apply() {
        CompilationUnit.mapWithin(["compound"], this.cu.ast_stream, x => this.parseCompound(x));
    }

    resynchronize(segment: ASTElement[]) {
        // TODO
    }
}