import { AsmStatement } from "../ast/AsmStatement";
import { ASTElement } from "../ast/ASTElement";
import { Class } from "../ast/Class";
import { CompoundStatement } from "../ast/CompoundStatement";
import { FunctionDefinition } from "../ast/FunctionDefinition";
import { Program } from "../ast/Program";
import { SimpleStatement } from "../ast/SimpleStatement";
import { AssignmentExpression, Expression, FieldReferenceExpression, FunctionCallExpression, LocalDefinitionExpression, NumericLiteralExpression, ReturnExpression, SpecifyExpression, StaticFunctionCallExpression, StaticReferenceExpression, VariableExpression, VoidExpression } from "../expression/ExpressionParser";

export function PrintTree(node: ASTElement, parent?: ASTElement): void {
    if (node instanceof Program) {
        console.log(mrecord(node.guid, [
            { name: "type", label: "Program" },
            { name: "module", label: `module ${node.module_name}` },
            ...node.contents.map(x => { return { name: x.guid, label: x.constructor.name } })
        ]));
        node.contents.map(x => console.log(`    n${node.guid}:n${x.guid} -> n${x.guid}`));
        node.contents.map(x => PrintTree(x, this));
    } else if (node instanceof Class) {
        console.log(mrecord(node.guid, [
            { name: "cname", label: `class ${node.name}` },
            ...node.fields.map(x => { return { name: x.guid, label: x.to_readable() } }),
        ]));
        if (node.statics.length) {
            console.log(`    n${node.guid} -> n${node.guid}_static:ntype`);
            console.log(mrecord(node.guid + "_static", [
                { name: "type", label: `stable for ${node.name}` },
                ...node.statics.map((x, y) => { return { name: x.name, label: `${y}: ${x.name}<${x.type.to_readable()}>` } })
            ]));
            for (const [name, method] of node.methods) {
                PrintTree(method);
                console.log(`    n${node.guid}_static:n${name} -> n${method.guid}`);
            }
        }
    } else if (node instanceof FunctionDefinition) {
        const entries = [
            { name: "type", label: `${node.is_static ? "static " : ""}${node.signature.to_readable()}` },
            ...node.args.map(x => { return { name: x.guid, label: "Argument: " + x.to_readable() } }),
        ];
        if (node.body) {
            entries.push({ name: "body", label: "CompoundStatement" });
            console.log(`    n${node.guid}:nbody->n${node.body.guid}:ntype`);
            PrintTree(node.body, this);
        }
        console.log(mrecord(node.guid, entries));
    } else if (node instanceof CompoundStatement) {
        console.log(mrecord(node.guid, [
            { name: "type", label: "CompoundStatement" },
            ...node.locals.map(x => { return { name: x.guid, label: "Local: " + x.to_readable() } }),
            ...node.lines.map(x => { return { name: x.guid, label: x.constructor.name } })
        ]));
        node.lines.map(x => PrintTree(x, this));
        node.lines.map(x => console.log(`    n${node.guid}:n${x.guid} -> n${x.guid}`));
    } else if (node instanceof SimpleStatement) {
        if (node.expression) {
            const entries = [
                { name: "statement_text", label: node.statement_text },
            ];
            PrintExpression(node.expression);
            console.log(`    n${node.guid} -> n${node.expression.guid}:nexpression`);
            console.log(mrecord(node.guid, entries));
        } else {
            console.log(mrecord(node.guid, [
                { name: "statement_text", label: node.statement_text },
                { name: "expression", label: "<nonterminal>" }
            ]));
        }
    } else if (node instanceof AsmStatement) {
        console.log(mrecord(node.guid, [{ name: "statement_text", label: node.statement_text }]))
    } else {
        console.error(`  (tried to graphviz unknown type ${node.constructor.name})`);
    }
}

export function PrintExpression(node: Expression) {
    const entries = [
        { name: "expression", label: node.constructor.name + "<" + node.valueType().to_readable() + ">" },
    ];
    if (node instanceof AssignmentExpression) {
        entries.push({ name: "lhs", label: "lhs" });
        entries.push({ name: "rhs", label: "rhs" });
        console.log(`    n${node.guid}:nlhs -> n${node.lhs.guid}:nexpression`);
        console.log(`    n${node.guid}:nrhs -> n${node.rhs.guid}:nexpression`);
        PrintExpression(node.lhs);
        PrintExpression(node.rhs);
    } else if (node instanceof FieldReferenceExpression) {
        entries.push({ name: "sub", label: "source" });
        entries.push({ name: "field", label: '\\"' + node.field + '\\"' });
        console.log(`    n${node.guid}:nsub -> n${node.sub.guid}:nexpression`);
        PrintExpression(node.sub);
    } else if (node instanceof StaticReferenceExpression) {
        entries.push({ name: "sub", label: node.sub.get_name() });
        entries.push({ name: "field", label: `\\"${node.field}\\" [${node.index}]` });
    } else if (node instanceof VariableExpression) {
        entries.push({ name: "name", label: '\\"' + node.name + '\\"' });
    } else if (node instanceof LocalDefinitionExpression) {
        entries.push({ name: "name", label: '\\"' + node.name + '\\"' });
    } else if (node instanceof FunctionCallExpression) {
        entries.push({ name: "function", label: `function<${node.type.to_readable()}>` });
        console.log(`    n${node.guid}:nfunction -> n${node.rhs.guid}:nexpression`);
        PrintExpression(node.rhs);
        for (const arg_idx in node.args) {
            entries.push({ name: `arg${arg_idx}`, label: `argument ${arg_idx}` });
            console.log(`    n${node.guid}:narg${arg_idx} -> n${node.args[arg_idx].guid}:nexpression`);
            PrintExpression(node.args[arg_idx]);
        }
    } else if (node instanceof StaticFunctionCallExpression) {
        entries.push({ name: "function", label: `function<${node.type.to_readable()}>` });
        entries.push({ name: "name", label: node.name });
        for (const arg_idx in node.args) {
            entries.push({ name: `arg${arg_idx}`, label: `argument ${arg_idx}` });
            console.log(`    n${node.guid}:narg${arg_idx} -> n${node.args[arg_idx].guid}:nexpression`);
            PrintExpression(node.args[arg_idx]);
        }
    } else if (node instanceof NumericLiteralExpression) {
        entries.push({ name: "value", label: `${node.value}` });
    } else if (node instanceof SpecifyExpression) {
        console.log(`    n${node.guid} -> n${node.sub.guid}`);
        PrintExpression(node.sub);
    } else if (node instanceof ReturnExpression) {
        console.log(`    n${node.guid} -> n${node.sub.guid}`);
        PrintExpression(node.sub);
    } else if (node instanceof VoidExpression) {
    } else {
        console.error(`  (tried to graphviz unknown expression type ${node.constructor.name})`);
    }

    console.log(record(node.guid, entries));
}

function mklabel(entries: { name: string, label: string }[]): string {
    return entries.map(x => `<n${x.name}>${x.label
        .replaceAll("<", "&#60;")
        .replaceAll(">", "&#62;")
        .replaceAll("|", "&#124;")}`).join(" | ");
}

function mrecord(name: string, entries: { name: string, label: string }[]): string {
    return `    n${name} [shape=Mrecord label="${mklabel(entries)}"];\n`;
}

function record(name: string, entries: { name: string, label: string }[]): string {
    return `    n${name} [shape=record label="${mklabel(entries)}"];\n`;
}