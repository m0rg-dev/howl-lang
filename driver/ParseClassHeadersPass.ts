import { ASTElement } from "../ast/ASTElement";
import { ClassHeaderElement } from "../ast/ClassHeaderElement";
import { TokenElement } from "../ast/TokenElement";
import { NameToken } from "../lexer/NameToken";
import { Token } from "../lexer/Token";
import { TokenType } from "../lexer/TokenType";
import { LocationFrom } from "../parser/Parser";
import { Classes } from "../registry/Registry";
import { CompilationUnit } from "./CompilationUnit";
import { LogLevel, Pass } from "./Pass";

export class ParseClassHeadersPass extends Pass {
    apply() {
        CompilationUnit.mapWithin(["cdecl"], this.cu.ast_stream, (segment: ASTElement[]) => {
            const name = (segment[1] as TokenElement<NameToken>).token.name;
            let parent = "";
            let interfaces: string[] = [];

            while (segment[segment.length - 2] instanceof TokenElement && segment[segment.length - 2]["token"].type == TokenType.Implements) {
                interfaces.push((segment[segment.length - 1] as TokenElement<NameToken>).token.name);
                segment.pop();
                segment.pop();
            }

            if (segment[segment.length - 2] instanceof TokenElement && segment[segment.length - 2]["token"].type == TokenType.Extends) {
                parent = (segment[segment.length - 1] as TokenElement<NameToken>).token.name;
                segment.pop();
                segment.pop();
            }

            // TODO checks
            const generics = (segment.slice(2).filter(x => x instanceof TokenElement && x.token.type == TokenType.Name) as TokenElement<NameToken>[]).map(x => x.token.name);
            segment.splice(0, segment.length, new ClassHeaderElement(LocationFrom(segment), name, generics, parent, interfaces, (segment[0] as TokenElement<Token>).token.type == TokenType.Interface));
            this.log(LogLevel.INFO, `${segment[0]}`, LocationFrom(segment));
        });
    }
}