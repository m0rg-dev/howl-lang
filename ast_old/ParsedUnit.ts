import { ParseResult } from './ParseResult';
import { Terminal } from './Terminal';

export abstract class ParsedUnit extends Terminal {
    parts: Terminal[];

    constructor(source: String, start: number) {
        super(source, start);
        this.parts = [];
    }

    abstract accept(): ParseResult;

    pretty_print(depth = 0): string {
        let parts: string[] = [];
        for (const part of this.parts) {
            parts.push(part.pretty_print(depth + 1));
        }
        return " ".repeat(depth) + `(${this.start}, ${this.end}) ${this.constructor.name}:\n` + parts.join("\n");
    }
}