import { LexerHandle } from "../lexer";
import { NameToken } from "../lexer/NameToken";
import { TokenType } from "../lexer/TokenType";
import { ASTElement, ErrorBadToken, Ok, ParseResult, Segment } from "./ASTElement";
import { Mangle, RecognizeBlock } from "./ASTUtil";
import { FunctionDefinition } from "./FunctionDefinition";
import { TypedItem } from "./TypedItem";
import { ClassRegistry, ClassType, PointerType, Type, TypeRegistry } from "../generator/TypeRegistry";
import { Scope } from "./Scope";

export class Class extends ASTElement implements Scope {
    name: string;
    fields: TypedItem[] = [];
    methods: FunctionDefinition[] = [];
    parent: Scope;

    constructor(parent: Scope) {
        super();
        this.parent = parent;
    }

    lookup_symbol(symbol: string): Type {
        return this.parent.lookup_symbol(symbol);
    }

    lookup_field(name: string): Type {
        for(const field of this.fields) {
            if(field.name == name) return field.type;
        }
        return undefined;
    }

    field_index(name: string): number {
        for(const index in this.fields) {
            if(this.fields[index].name == name) return Number.parseInt(index);
        }
        return -1;
    }

    bracket(handle: LexerHandle): LexerHandle {
        const sub = handle.clone();
        sub.expect(TokenType.Class);
        sub.expect(TokenType.Name);

        sub.check(TokenType.OpenBrace);
        RecognizeBlock(sub);

        return handle.bracket(0, handle.compare(sub));
    }

    parse(handle: LexerHandle): ParseResult {
        if (handle.lookahead().type != TokenType.Class) throw new Error("COMPILER BUG");
        handle.consume();

        if (handle.lookahead().type != TokenType.Name) return { ok: false, errors: [ErrorBadToken(handle, TokenType.Name)] };
        const name = (handle.consume() as NameToken);

        if (handle.lookahead().type != TokenType.OpenBrace) return { ok: false, errors: [ErrorBadToken(handle, TokenType.OpenBrace)] };
        handle.consume();

        this.name = name.name;
        TypeRegistry.set(this.name, new PointerType(new ClassType(this.name)));

        while (handle.lookahead() && handle.lookahead().type != TokenType.CloseBrace) {
            switch (handle.lookahead().type) {
                case TokenType.Name:
                    const field = new TypedItem();
                    const rc = field.parse(handle);
                    if (rc.ok) {
                        this.fields.push(field);
                    } else {
                        return rc;
                    }
                    if (handle.lookahead().type == TokenType.Semicolon) {
                        handle.consume();
                    } else {
                        return { ok: false, errors: [ErrorBadToken(handle, TokenType.Semicolon)] };
                    }
                    break;
                case TokenType.Function:
                    const func = new FunctionDefinition(this);
                    const rc2 = func.parse(handle);
                    if(rc2.ok) {
                        Mangle(func, this);
                        this.methods.push(func);
                    } else {
                        return rc2;
                    }
                    break;
            }
            // TODO this is kind of a hack
            ClassRegistry.set(this.name, this);
        }

        if (handle.lookahead().type != TokenType.CloseBrace) return { ok: false, errors: [ErrorBadToken(handle, TokenType.CloseBrace)] };
        return Ok();
    }

    synthesize(): string {
        return [
            `%${this.name} = type {`,
            ...this.fields.map((x, y) => `    ${x.type.to_ir()}${y == this.fields.length - 1 ? " " : ","}        ;; ${x.name}`),
            `}\n`,
            ...this.methods.map(x => x.synthesize() + "\n"),
        ].join("\n");
    }
}
