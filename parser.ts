import * as fs from 'fs';
import { Program } from './ast/Program';

export function why_not(e: string): boolean {
    console.error(e);
    return false;
}

const source = fs.readFileSync(process.argv[2]).toString();
const c = new Program(source, 0);
console.error(c.accept());

console.error(c.pretty_print());
console.log(c.synthesize());
