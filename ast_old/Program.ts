import { Synthesizable } from "../generator";
import { why_not } from "../parser";
import { TokenType } from "../lexer/TokenType";
import { Class } from "./Class";
import { FunctionDefinition } from "./FunctionDefinition";
import { ParsedUnit } from "./ParsedUnit";
import { ParseResult } from "./ParseResult";

export class Program extends ParsedUnit implements Synthesizable {
    classdefs: Class[] = [];
    funcdefs: FunctionDefinition[] = [];

    accept(): ParseResult {
        while (this.mark <= this.source.length) {
            const tok = this.next_token();
            let err: ParseResult;
            console.error(tok);
            switch(tok.type) {
                case TokenType.Class:
                    const c = new Class(this.source, this.mark);
                    err = c.accept();
                    if(!err.ok) {
                        return err;
                    }
                    this.accepted(c);
                    this.classdefs.push(c);
                    this.parts.push(c);
                    break;
                case TokenType.Function:
                    const func = new FunctionDefinition(this.source, this.mark);
                    err = func.accept();
                    if(!err.ok) {
                        return err
                    }
                    this.accepted(func);
                    this.funcdefs.push(func);
                    this.parts.push(func);
                    break;
                case TokenType.EOF:
                    return ParseResult.Ok();
                default:
                    return ParseResult.Fail(this, "Expected a function or class definition");
            }
        }
        return ParseResult.Fail(this, "Premature end of file");
    }

    synthesize(): string {
        let parts: string[] = [];

        for (const c of this.classdefs) {
            parts.push(c.synthesize());
        }

        for (const f of this.funcdefs) {
            parts.push(f.synthesize());
        }

        return parts.join("\n\n");
    }
}