import { LexerHandle } from "../lexer";
import { TokenType } from "../lexer/TokenType";
import { Class } from "./Class";
import { FunctionDefinition } from "./FunctionDefinition";

export function RecognizeBlock(handle: LexerHandle): boolean {
    if(!handle.rolling) return false;
    const stack: TokenType[] = [];

    while(handle.lookahead()) {
        const tok = handle.consume();
        switch(tok.type) {
            case TokenType.OpenBrace:
                stack.push(TokenType.OpenBrace);
                break;
            case TokenType.OpenParen:
                stack.push(TokenType.OpenParen);
                break;
            case TokenType.CloseBrace:
                if(stack.pop() != TokenType.OpenBrace) return false;
                break;
            case TokenType.CloseParen:
                if(stack.pop() != TokenType.OpenParen) return false;
                break;
        }
        if(stack.length == 0) return true;
    }
}

export function Mangle(method: FunctionDefinition, cl: Class) {
    method.mangled_name = `__${cl.name}_${method.signature.name}`;
}