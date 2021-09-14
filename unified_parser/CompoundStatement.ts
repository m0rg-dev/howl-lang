import { ASTElement, isAstElement, TokenStream, VoidElement } from "./ASTElement";
import { Assert, First, InOrder, Invert, Literal, Star } from "./Matcher";
import { SimpleStatement } from "./SimpleStatement";
import { ApplyPass, Braces, ExpressionPass, MatchElement } from "./Parser";
import { flattenBlock, IRAlloca, IRBlock, IRLabel, IRLabelStatement, IRNamedIdentifier, IRPointerType, IRStatement, isSynthesizable, Synthesizable } from "../generator/IR";
import { Token } from "../lexer/Token";
import { IfStatement } from "./IfStatement";


export class CompoundStatement extends VoidElement implements Synthesizable {
    substatements: ASTElement[];
    source: TokenStream;
    label: IRLabel;
    constructor(source?: TokenStream) {
        super();
        this.source = source;
        this.label = new IRLabel();
    }
    parse(): CompoundStatement {
        this.source = ApplyPass(this.source.slice(1, this.source.length - 1), {
            name: "CompoundStatement",
            rules: [{
                name: "RecognizeSubCompounds",
                match: InOrder(Assert(Literal("OpenBrace")), Braces()),
                replace: (input: TokenStream) => [new CompoundStatement(input).parse()]
            }]
        });
        this.source = ApplyPass(this.source, ExpressionPass);
        this.source = ApplyPass(this.source, {
            name: "Statements",
            rules: [
                {
                    name: "IfStatement",
                    match: InOrder(
                        Literal("If"),
                        MatchElement(),
                        Literal("CompoundStatement")
                    ),
                    replace: (input: [Token, ASTElement, CompoundStatement]) => {
                        return [new IfStatement(input[1], input[2])];
                    }
                },
                {
                    name: "SplitSimpleStatements",
                    match: InOrder(Invert(First(
                        Literal("IfStatement"),
                        Literal("SimpleStatement")
                    )), Star(Invert(Literal("Semicolon"))), Literal("Semicolon")),
                    replace: (input: TokenStream) => [new SimpleStatement(input.slice(0, input.length - 1))]
                }
            ]
        });
        this.substatements = this.source.filter(x => isAstElement(x)) as ASTElement[];
        return this;
    }
    toString = () => `CompoundStatement`;

    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if (this._ir_block) return this._ir_block;
        const statements: IRStatement[] = [
            new IRLabelStatement(this.label)
        ];

        this.scope.locals.forEach((x, y) => {
            statements.push(new IRAlloca({ type: new IRPointerType(x.toIR()), location: new IRNamedIdentifier(`%${y}`) }));
        })

        this.substatements.forEach(x => {
            if (!isSynthesizable(x)) return;
            statements.push(...flattenBlock(x.synthesize()));
        });

        return this._ir_block = {
            output_location: undefined,
            statements: statements
        };
    }
}
function MatchExpression(): import("./Matcher").Matcher {
    throw new Error("Function not implemented.");
}

