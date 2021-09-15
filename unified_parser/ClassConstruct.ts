import { IRBlock, IRSomethingElse, Synthesizable } from "../generator/IR";
import { Token } from "../lexer/Token";
import { TokenType } from "../lexer/TokenType";
import { DeregisterType, GetType, RegisterType, TypeRegistry } from "../registry/TypeRegistry";
import { FixHierarchy, ReferenceLocals } from "../transformers/Transformer";
import { ASTElement, TokenStream } from "./ASTElement";
import { FunctionConstruct } from "./FunctionConstruct";
import { Assert, InOrder, Literal, Optional } from "./Matcher";
import { ApplyPass, ArgumentDefinition, Braces, BracesWithAngle, ClassField, ConvertTypes, MatchFunctionDefinitions, NameExpression, ParseError, Pass, TypeLiteral } from "./Parser";
import { ClassType, TemplateType } from "./TypeObject";


export class PartialClassConstruct extends ASTElement {
    name: string;
    source: TokenStream;
    constructor(parent: ASTElement, name: string, source: TokenStream) {
        super(parent);
        this.name = name;
        this.source = [...source];
        TypeRegistry.set(this.name, new ClassType(undefined));
    }

    parse(): ClassConstruct | ParseError {
        const rc = new ClassConstruct(this.parent, this.name);
        let body = ApplyPass(this, this.source, {
            name: "FindGenerics",
            rules: [{
                name: "FindGenerics",
                match: InOrder(Literal("Class"), Literal("NameExpression"), Optional(InOrder(Assert(Literal("OpenAngle")), BracesWithAngle())), Assert(Literal("OpenBrace")), Braces()),
                replace: (input: TokenStream) => {
                    if (!(input[2] instanceof ASTElement) && input[2].type == TokenType.OpenAngle) {
                        const m = BracesWithAngle()(input.slice(2)).length;
                        for (const item of input.slice(3, 3 + (m - 1))) {
                            // TODO parsing
                            if (item instanceof NameExpression) {
                                rc.generic_fields.push(item.name);
                            }
                        }
                    }
                    return [];
                }
            }]
        });

        rc.generic_fields.forEach(x => RegisterType(x, new TemplateType(x)));
        body = ApplyPass(this, this.source, ConvertTypes);
        rc.generic_fields.forEach(x => DeregisterType(x));

        body = ApplyPass(this, body, ParseClassBody);

        for (const item of body) {
            if (item instanceof ClassField) {
                rc.fields.push(item);
            } else if (item instanceof FunctionConstruct) {
                if (!item.function_is_static) {
                    item.args.unshift(new ArgumentDefinition(this.parent, "self", GetType(this.name)));
                    item.scope.locals.set("self", GetType(this.name));
                    item.walk(FixHierarchy, () => { }, this);
                    item.walk(ReferenceLocals, (n: ASTElement) => { });
                }
                rc.methods.push(item);
            }
        }

        return rc;
    }

    toString = () => `PartialClass(${this.name})`;
}

export class ClassConstruct extends ASTElement implements Synthesizable {
    name: string;
    fields: ClassField[] = [];
    methods: FunctionConstruct[] = [];
    is_stable = false;
    has_stable = false;
    generic_fields: string[] = [];

    constructor(parent: ASTElement, name: string) {
        super(parent);
        this.name = name;

        // not cursed at all >_>
        if (TypeRegistry.has(this.name)) {
            (TypeRegistry.get(this.name) as ClassType).source = this;
        } else {
            TypeRegistry.set(this.name, new ClassType(this));
        }
    }
    toString = () => `Class<${this.generic_fields.join(", ")}>(${this.name})`;
    stableType = () => TypeRegistry.get(`__${this.name}_stable_t`) as ClassType;

    synthesize(): IRBlock {
        return {
            output_location: undefined,
            statements: [
                new IRSomethingElse(`%${this.name} = type {`),
                new IRSomethingElse(this.fields.map(x => x.field_type.toIR().toString()).join(", ")),
                new IRSomethingElse(`}`)
            ]
        };
    }
}


const ParseClassBody: Pass = {
    name: "ParseClassBody",
    rules: [
        {
            name: "MatchClassFields",
            match: InOrder(Literal("TypeLiteral"), Literal("NameExpression"), Literal("Semicolon")),
            replace: (input: [TypeLiteral, NameExpression, Token], parent: ASTElement) => {
                return [new ClassField(parent, input[1].name, input[0].field_type)];
            }
        },
        MatchFunctionDefinitions
    ]
};