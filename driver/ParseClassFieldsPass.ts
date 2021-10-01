import { ASTElement } from "../ast/ASTElement";
import { FunctionElement } from "../ast/FunctionElement";
import { TokenElement } from "../ast/TokenElement";
import { TypedItemElement } from "../ast/TypedItemElement";
import { TypeElement } from "../ast/TypeElement";
import { TokenType } from "../lexer/TokenType";
import { LocationFrom } from "../parser/Parser";
import { CompilationUnit } from "./CompilationUnit";
import { Errors } from "./Errors";
import { Pass } from "./Pass";

export class ParseClassFieldsPass extends Pass {
    apply() {
        CompilationUnit.mapWithin(["cbody"], this.cu.ast_stream, (segment) => {
            const s2: ASTElement[] = [];

            // drop {}
            segment.shift();
            segment.pop();

            while (segment.length) {
                const el = segment.shift();
                if (el instanceof FunctionElement) {
                    s2.push(el);
                } else if (el instanceof TypeElement) {
                    const name = segment.shift();
                    if (name instanceof TokenElement && name.token.type == TokenType.Name) {
                        const semi = segment.shift();
                        if (semi instanceof TokenElement && semi.token.type == TokenType.Semicolon) {
                            const ti = new TypedItemElement(LocationFrom([el, name, semi]), name.token.name, el.asTypeObject());
                            ti.generics = el.generics.map(x => x.asTypeObject());
                            s2.push(ti);
                        } else {
                            this.emitCompilationError(Errors.EXPECTED_SEMICOLON, "Expected semicolon", semi.source_location);
                        }
                    } else {
                        this.emitCompilationError(Errors.EXPECTED_NAME, "Expected name", name.source_location);
                        return;
                    }
                } else {
                    this.emitCompilationError(Errors.EXPECTED_TYPE, "Expected type", el.source_location);
                    return;
                }
            }

            segment.splice(0, 0, ...s2);
        });
    }
}