import * as fs from 'fs';
import { Lexer } from './lexer';
import { Parse } from './parser/Parser';

import * as sms from 'source-map-support';
import { InitRegistry } from './registry/Registry';
sms.install();

InitRegistry();

const source = fs.readFileSync(process.argv[2]).toString();
const lexer = new Lexer(source);
const parsed = Parse(lexer.token_stream);