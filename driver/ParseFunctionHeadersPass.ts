import { ASTElement } from "../ast/ASTElement";
import { FunctionHeaderElement } from "../ast/FunctionHeaderElement";
import { TokenElement } from "../ast/TokenElement";
import { TypedItemElement } from "../ast/TypedItemElement";
import { TypeElement } from "../ast/TypeElement";
import { TokenType } from "../lexer/TokenType";
import { Hug } from "../parser/Matcher";
import { LocationFrom } from "../parser/Parser";
import { Type } from "../type_inference/Type";
import { CompilationUnit } from "./CompilationUnit";
import { Errors } from "./Errors";
import { Pass } from "./Pass";

export class ParseFunctionHeadersPass extends Pass {
    apply() {
        CompilationUnit.mapWithin(["fdecl"], this.cu.ast_stream, (segment: ASTElement[]) => {
            let is_static = false;
            if (segment[0] instanceof TokenElement && segment[0].token.type == TokenType.Static) {
                segment.shift();
                is_static = true;
            }

            if (!(segment[0] instanceof TokenElement && segment[0].token.type == TokenType.Function)) {
                this.emitCompilationError(Errors.EXPECTED_FUNCTION, "Expected 'fn'", segment[0].source_location);
                return;
            }
            segment.shift();

            if (!(segment[0] instanceof TypeElement)) {
                this.emitCompilationError(Errors.EXPECTED_TYPE, "Expected type", segment[0].source_location);
                return;
            }

            if (!(segment[1] instanceof TokenElement && segment[1].token.type == TokenType.Name)) {
                this.emitCompilationError(Errors.EXPECTED_NAME, "Expected name", segment[1].source_location);
                return;
            }

            let raw_args = segment.slice(3);
            // TODO
            raw_args = raw_args.slice(0, raw_args.findIndex(x => x instanceof TokenElement && x.token.type == TokenType.CloseParen));
            const args: TypedItemElement[] = [];
            const throws: Type[] = [];

            const rest = segment.slice(3 + raw_args.length + 1);

            while (raw_args.length) {
                const type = raw_args.shift();
                if (type instanceof TypeElement) {
                    const name = raw_args.shift();
                    if (name instanceof TokenElement && name.token.type == TokenType.Name) {
                        if (!raw_args.length || (raw_args[0] instanceof TokenElement && raw_args[0].token.type == TokenType.Comma)) {
                            raw_args.shift();
                            args.push(new TypedItemElement(LocationFrom([type, name]), name.token.name, type.asTypeObject()));
                        } else {
                            this.emitCompilationError(Errors.EXPECTED_COMMA, "Expected comma", raw_args[0].source_location);
                            return;
                        }
                    } else {
                        this.emitCompilationError(Errors.EXPECTED_NAME, "Expected name", name?.source_location || type.source_location);
                    }
                } else {
                    this.emitCompilationError(Errors.EXPECTED_TYPE, "Expected type", type.source_location);
                }
            }

            if (rest.length) {
                if (rest[0] instanceof TokenElement && rest[0].token.type == TokenType.Throws) {
                    rest.shift();
                    while (rest.length) {
                        const type = rest.shift();
                        if (type instanceof TypeElement) {
                            if (!raw_args.length || (raw_args[0] instanceof TokenElement && raw_args[0].token.type == TokenType.Comma)) {
                                raw_args.shift();
                                throws.push(type.asTypeObject());
                            } else {
                                this.emitCompilationError(Errors.EXPECTED_COMMA, "Expected comma", raw_args[0].source_location);
                                return;
                            }
                        } else {
                            this.emitCompilationError(Errors.EXPECTED_TYPE, "Expected type", type.source_location);
                        }
                    }
                } else {
                    this.emitCompilationError(Errors.EXPECTED_THROWS, "Expected 'throws'", rest[0].source_location);
                }
            }

            segment.splice(0, segment.length, new FunctionHeaderElement(LocationFrom(segment), is_static, segment[1].token.name, segment[0], args, throws));
        });
    }
}