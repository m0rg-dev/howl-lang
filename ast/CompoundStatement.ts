import { Type } from "../generator/TypeRegistry";
import { LexerHandle } from "../lexer";
import { TokenType } from "../lexer/TokenType";
import { AsmStatement } from "./AsmStatement";
import { ASTElement, ErrorBadToken, ErrorEOF, Ok, ParseResult, Segment } from "./ASTElement";
import { RecognizeBlock } from "./ASTUtil";
import { Scope } from "./Scope";
import { SimpleStatement } from "./SimpleStatement";
import { TypedItem } from "./TypedItem";

export class CompoundStatement extends ASTElement implements Scope {
    lines: ASTElement[] = [];
    parent: Scope;
    locals: TypedItem[] = [];

    constructor(parent: Scope) {
        super();
        this.parent = parent;
    }

    lookup_symbol(symbol: string): Type {
        for(const item of this.locals) {
            if(item.name == symbol) return item.type;
        }
        return this.parent.lookup_symbol(symbol);
    }

    register_local(name: string, type: Type) {
        const item = new TypedItem();
        item.name = name;
        item.type = type;
        this.locals.push(item);
        console.error(`RegisterLocal (CompoundStatement) ${name} ${type.to_ir()}`);
    }

    current_return = () => this.parent.current_return();

    bracket(handle: LexerHandle): LexerHandle {
        const sub = handle.clone();
        sub.check(TokenType.OpenBrace);
        RecognizeBlock(sub);
        return handle.bracket(0, handle.compare(sub));
    }

    parse(handle: LexerHandle): ParseResult {
        if (handle.lookahead().type != TokenType.OpenBrace) return { ok: false, errors: [ErrorBadToken(handle, TokenType.OpenBrace)] };
        handle.consume();

        const segments: Segment[] = [];
        while (handle.lookahead() && handle.lookahead().type != TokenType.CloseBrace) {
            if (handle.lookahead().type == TokenType.OpenBrace) {
                const statement = new CompoundStatement(this);
                segments.push({ handle: statement.bracket(handle), ast: statement });
            } else if (handle.lookahead().type == TokenType.EOF) {
                return { ok: false, errors: [ErrorEOF(handle)] };
            } else if (handle.lookahead().type == TokenType.AsmLiteral) {
                const statement = new AsmStatement();
                segments.push({ handle: statement.bracket(handle), ast: statement });
            } else {
                const statement = new SimpleStatement(this);
                segments.push({ handle: statement.bracket(handle), ast: statement });
            }
        }

        if (handle.lookahead().type != TokenType.CloseBrace) return { ok: false, errors: [ErrorBadToken(handle, TokenType.CloseBrace)] };
        handle.consume();
        
        const rc = Ok();
        for (const segment of segments) {
            console.error(`=> Source segment: <<<${segment.handle}>>>`);
            let rc2 = segment.ast.parse(segment.handle);
            if (!rc2.ok) {
                rc.ok = false;
                rc.errors.push(...rc2.errors);
            }
            this.lines.push(segment.ast);
        }

        return rc;
    }

    synthesize(): string {
        return this.lines.map(x => "    " + x.synthesize()).join("\n");
    }
}