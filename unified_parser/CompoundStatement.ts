import { flattenBlock, IRAlloca, IRBlock, IRLabel, IRLabelStatement, IRNamedIdentifier, IRPointerType, IRStatement, isSynthesizable, Synthesizable } from "../generator/IR";
import { Token } from "../lexer/Token";
import { FixHierarchy, ReferenceLocals } from "../transformers/Transformer";
import { ASTElement, isAstElement, TokenStream } from "./ASTElement";
import { IfStatement } from "./IfStatement";
import { Assert, First, InOrder, Invert, Literal, Star } from "./Matcher";
import { ApplyPass, Braces, ExpressionPass, LocalDefinition, LocalDefinitionsPass, MatchElement } from "./Parser";
import { SimpleStatement } from "./SimpleStatement";
import { WhileStatement } from "./WhileStatement";


export class CompoundStatement extends ASTElement implements Synthesizable {
    substatements: ASTElement[];
    source: TokenStream;
    label: IRLabel;
    constructor(parent: ASTElement, source?: TokenStream) {
        super(parent);
        this.source = source;
        this.label = new IRLabel();
        this.hasOwnScope = true;
    }

    parse(): CompoundStatement {
        this.source = ApplyPass(this, this.source.slice(1, this.source.length - 1), {
            name: "CompoundStatement",
            rules: [{
                name: "RecognizeSubCompounds",
                match: InOrder(Assert(Literal("OpenBrace")), Braces()),
                replace: (input: TokenStream) => [new CompoundStatement(this, input).parse()]
            }]
        });
        this.source = ApplyPass(this, this.source, LocalDefinitionsPass);
        this.source = ApplyPass(this, this.source, ExpressionPass);

        this.source.filter(x => x instanceof LocalDefinition).forEach(x => {
            this.scope.locals.set((x as LocalDefinition).name, (x as LocalDefinition).local_type);
        });

        this.source.forEach((x, y) => {
            if (x instanceof ASTElement) {
                x.walk(FixHierarchy, () => { }, this);
                x.walk(ReferenceLocals, (n: ASTElement) => { this.source[y] = n });
            }
        });

        this.source = ApplyPass(this, this.source, {
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
                        return [new IfStatement(this, input[1], input[2])];
                    }
                },
                {
                    name: "WhileStatement",
                    match: InOrder(
                        Literal("While"),
                        MatchElement(),
                        Literal("CompoundStatement")
                    ),
                    replace: (input: [Token, ASTElement, CompoundStatement]) => {
                        return [new WhileStatement(this, input[1], input[2])];
                    }
                },
                {
                    name: "SplitSimpleStatements",
                    match: InOrder(Invert(First(
                        Literal("IfStatement"),
                        Literal("WhileStatement"),
                        Literal("SimpleStatement"),
                    )), Star(Invert(Literal("Semicolon"))), Literal("Semicolon")),
                    replace: (input: TokenStream) => [new SimpleStatement(this, input.slice(0, input.length - 1))]
                }
            ]
        });
        this.substatements = this.source.filter(x => isAstElement(x)) as ASTElement[];
        return this;
    }
    toString = () => `CompoundStatement`;

    _ir_block: IRBlock;
    synthesize(): IRBlock {
        if (this._ir_block) return { output_location: this._ir_block.output_location, statements: [] };
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

