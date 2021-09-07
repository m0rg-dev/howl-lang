import { Synthesizable } from "../generator";
import { why_not } from "../parser";
import { TokenType } from "../TokenType";
import { Class } from "./Class";
import { FunctionDefinition } from "./FunctionDefinition";
import { ParsedUnit } from "./ParsedUnit";

export class Program extends ParsedUnit implements Synthesizable {
    classdefs: Class[] = [];
    funcdefs: FunctionDefinition[] = [];

    accept(): boolean {
        while (this.mark <= this.source.length) {
            let c = new Class(this.source, this.mark);
            let func = new FunctionDefinition(this.source, this.mark);
            if (c.accept()) {
                this.accepted(c);
                this.classdefs.push(c);
                this.parts.push(c);
            } else if (func.accept()) {
                this.accepted(func);
                this.funcdefs.push(func);
                this.parts.push(func);
            } else {
                let tok = this.next_token();
                if (tok.type == TokenType.EOF) {
                    console.error("Reached end of input successfully.");
                    break;
                }
                return why_not("Expected a function or class definition");
            }
        }
        return true;
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