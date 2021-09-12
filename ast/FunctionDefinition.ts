import { LexerHandle } from "../lexer";
import { TokenType } from "../lexer/TokenType";
import { ASTElement, ErrorBadToken, ErrorBadType, Ok, ParseResult, Segment } from "./ASTElement";
import { RecognizeBlock } from "./ASTUtil";
import { CompoundStatement } from "./CompoundStatement";
import { TypedItem } from "./TypedItem";
import { StaticFunctionRegistry, FunctionType, Type, TypeRegistry } from "../generator/TypeRegistry";
import { reset } from "../generator/Synthesizable";
import { Scope } from "./Scope";

export class FunctionDefinition extends ASTElement implements Scope {
    signature: TypedItem;
    is_static = false;
    mangled_name: string;
    args: TypedItem[] = [];
    body: CompoundStatement;
    parent: Scope;

    constructor(parent: Scope) {
        super();
        this.parent = parent;
    }

    lookup_symbol(symbol: string): Type {
        for (const item of this.args) {
            if (item.name == symbol) return item.type;
        }
        return this.parent.lookup_symbol(symbol);
    }

    register_local(name: string, type: Type) {
        this.parent.register_local(name, type);
    }

    current_return = () => (this.signature.type as FunctionType).return_type();

    bracket(handle: LexerHandle): LexerHandle {
        const sub = handle.clone();
        sub.expect(TokenType.Function);
        if (sub.lookahead().type == TokenType.Static) sub.consume();
        sub.consume_through(TokenType.OpenParen);
        sub.rollback();

        sub.check(TokenType.OpenParen);
        RecognizeBlock(sub);

        if (sub.lookahead().type == TokenType.OpenBrace) {
            RecognizeBlock(sub);
        } else {
            sub.expect(TokenType.Semicolon);
        }

        return handle.bracket(0, handle.compare(sub));
    }

    parse(handle: LexerHandle): ParseResult {
        if (handle.lookahead().type != TokenType.Function) throw new Error("COMPILER BUG");
        handle.consume();
        if (handle.lookahead().type == TokenType.Static) {
            this.is_static = true;
            handle.consume();
        }

        const signature = new TypedItem();
        const rc = signature.parse(handle);
        if (rc.ok) {
            this.signature = signature;
        } else {
            return rc;
        }

        if (handle.lookahead().type != TokenType.OpenParen) return { ok: false, errors: [ErrorBadToken(handle, TokenType.OpenParen)] };
        handle.consume();

        while (handle.lookahead() && handle.lookahead().type != TokenType.CloseParen) {
            const arg = new TypedItem();
            const rc = arg.parse(handle);
            if (rc.ok) {
                this.args.push(arg);
            } else {
                return rc;
            }

            if (handle.lookahead().type != TokenType.CloseParen && handle.lookahead().type != TokenType.Comma) {
                return { ok: false, errors: [ErrorBadToken(handle, TokenType.CloseParen, TokenType.Comma)] };
            }
            if (handle.lookahead().type == TokenType.Comma) handle.consume();
        }

        if (handle.lookahead().type != TokenType.CloseParen) return { ok: false, errors: [ErrorBadToken(handle, TokenType.CloseParen)] };
        handle.consume();

        // TODO this is kind of a hack
        signature.type = new FunctionType(signature.type, this.args.map(x => x.type));
        if(this.is_static) {
            StaticFunctionRegistry.set(this.signature.name, this);
        }
        if (handle.lookahead().type == TokenType.OpenBrace) {
            this.body = new CompoundStatement(this);
            return this.body.parse(handle);
        } else if (handle.lookahead().type == TokenType.Semicolon) {
            handle.consume();
            return Ok();
        } else {
            return { ok: false, errors: [ErrorBadToken(handle, TokenType.OpenBrace, TokenType.Semicolon)] };
        }
    }

    synthesize(): string {
        reset();
        if (this.body) {
            return [
                `define ${(this.signature.type as FunctionType).return_type().to_ir()} @${this.ir_name()}(${this.args.map(x => `${x.type.to_ir()} %__arg_${x.name}`).join(", ")}) {`,
                ...this.args.map(x => `    %${x.name} = alloca ${x.type.to_ir()}\n    store ${x.type.to_ir()} %__arg_${x.name}, ${x.type.to_ir()}* %${x.name}`),
                this.body.synthesize(),
                `}`
            ].join("\n");
        } else {
            return `declare ${(this.signature.type as FunctionType).return_type().to_ir()} @${this.ir_name()}(${this.args.map(x => `${x.type.to_ir()}`).join(", ")})`;
        }
    }

    ir_name(): string {
        return this.mangled_name || this.signature.name;
    }
}