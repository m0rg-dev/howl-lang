import * as fs from 'fs';
import { Lexer } from './lexer';
import { Parse } from './parser/Parser';

import * as sms from 'source-map-support';
import { Functions, InitRegistry } from './registry/Registry';
import { RunTypeInference } from './type_inference/TypeInference';
sms.install();

InitRegistry();

const source = fs.readFileSync(process.argv[2]).toString();
const lexer = new Lexer(source);
Parse(lexer.token_stream);
Functions.forEach(RunTypeInference);
