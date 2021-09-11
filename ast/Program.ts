import { LexerHandle } from "../lexer";
import { TokenType } from "../lexer/TokenType";
import { ASTElement, ParseResult, Ok, Segment, ErrorBadToken } from "./ASTElement";
import { Class } from "./Class";
import { FunctionDefinition } from "./FunctionDefinition";
import * as util from 'util';
import { Scope } from "./Scope";
import { Type } from "../generator/TypeRegistry";

export class Program extends ASTElement implements Scope {
    contents: ASTElement[] = [];
    functions: Map<string, FunctionDefinition> = new Map();

    lookup_symbol(name: string): Type {
        return this.functions.get(name).signature.type;
    }

    bracket(_: LexerHandle): LexerHandle {
        throw new Error("don't call this please");
    }

    parse(handle: LexerHandle): ParseResult {
        const rc = Ok();
        const segments: Segment[] = [];
        outer: while (handle.lookahead()) {
            switch (handle.lookahead().type) {
                case TokenType.Class:
                    const cl = new Class(this);
                    segments.push({ handle: cl.bracket(handle), ast: cl });
                    break;
                case TokenType.Function:
                    const func = new FunctionDefinition(this);
                    segments.push({ handle: func.bracket(handle), ast: func });
                    break;
                case TokenType.EOF:
                    handle.consume();
                    break outer;
                default:
                    rc.ok = false;
                    rc.errors.push(ErrorBadToken(handle, TokenType.Class));
                    handle.consume();
                    break;
            }
        }

        for (const segment of segments) {
            console.error(`=> Source segment: <<<${segment.handle}>>>`);
            let rc2 = segment.ast.parse(segment.handle);
            if (!rc2.ok) {
                rc.ok = false;
                rc.errors.push(...rc2.errors);
            }
            console.error(util.inspect(segment.ast, { depth: null }));
            this.contents.push(segment.ast);

            if(segment.ast.constructor.name == "FunctionDefinition") {
                this.functions.set((segment.ast as FunctionDefinition).signature.name,
                    (segment.ast as FunctionDefinition));
            }
        }

        return rc;
    }

    synthesize(): string {
        return this.contents.map(x => x.synthesize()).join("\n\n");
    }
}