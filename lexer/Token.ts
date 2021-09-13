import { TokenType } from './TokenType';

export class Token {
    type: TokenType;
    start: number;
    length: number;
    text: string;
}
