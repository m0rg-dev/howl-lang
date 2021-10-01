import { ASTElement } from "../ast/ASTElement";
import { FunctionHeaderElement } from "../ast/FunctionHeaderElement";
import { TokenElement } from "../ast/TokenElement";
import { TypedItemElement } from "../ast/TypedItemElement";
import { TypeElement } from "../ast/TypeElement";
import { TokenType } from "../lexer/TokenType";
import { LocationFrom } from "../parser/Parser";
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

            const rest = segment.slice(3, -1);
            const args: TypedItemElement[] = [];

            while (rest.length) {
                const type = rest.shift();
                if (type instanceof TypeElement) {
                    const name = rest.shift();
                    if (name instanceof TokenElement && name.token.type == TokenType.Name) {
                        if (!rest.length || (rest[0] instanceof TokenElement && rest[0].token.type == TokenType.Comma)) {
                            rest.shift();
                            args.push(new TypedItemElement(LocationFrom([type, name]), name.token.name, type));
                        } else {
                            this.emitCompilationError(Errors.EXPECTED_COMMA, "Expected comma", rest[0].source_location);
                            return;
                        }
                    } else {
                        this.emitCompilationError(Errors.EXPECTED_NAME, "Expected name", name.source_location);
                    }
                } else {
                    this.emitCompilationError(Errors.EXPECTED_TYPE, "Expected type", type.source_location);
                }
            }

            segment.splice(0, segment.length, new FunctionHeaderElement(LocationFrom(segment), is_static, segment[1].token.name, segment[0], args));
        });
    }
}