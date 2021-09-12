import { AsmStatement } from "../ast/AsmStatement";
import { ASTElement } from "../ast/ASTElement";
import { Class } from "../ast/Class";
import { CompoundStatement } from "../ast/CompoundStatement";
import { FunctionDefinition } from "../ast/FunctionDefinition";
import { Program } from "../ast/Program";
import { SimpleStatement } from "../ast/SimpleStatement";
import { AssignmentExpression, Expression, FieldReferenceExpression, FunctionCallExpression, LocalDefinitionExpression, NumericLiteralExpression, SpecifyExpression, VariableExpression } from "../expression/ExpressionParser";

export function PrintTree(node: ASTElement, parent?: ASTElement): void {
    if (node instanceof Program) {
        console.log(mkrecord(node.guid, [
            { name: "type", label: "Program" },
            ...node.contents.map(x => { return { name: x.guid, label: x.constructor.name } })
        ]));
        node.contents.map(x => console.log(`    n${node.guid}:n${x.guid} -> n${x.guid}`));
        node.contents.map(x => PrintTree(x, this));
    } else if (node instanceof Class) {
        console.log(mkrecord(node.guid, [
            { name: "cname", label: node.name },
            ...node.fields.map(x => { return { name: x.guid, label: x.to_readable() } }),
            ...node.methods.map(x => { return { name: x.guid, label: x.signature.to_readable() } }),
        ]));
        node.methods.map(x => console.log(`    n${node.guid}:n${x.guid} -> n${x.guid}`));
        node.methods.map(x => PrintTree(x, this));
    } else if (node instanceof FunctionDefinition) {
        const entries = [
            { name: "type", label: `${node.signature.to_readable()}` },
            ...node.args.map(x => { return { name: x.guid, label: "Argument: " + x.to_readable() } }),
            ...node.locals.map(x => { return { name: x.guid, label: "Local: " + x.to_readable() } }),
        ];
        if (node.body) {
            entries.push({ name: "body", label: "CompoundStatement" });
            console.log(`    n${node.guid}:nbody->n${node.body.guid}:ntype`);
            PrintTree(node.body, this);
        }
        console.log(mkrecord(node.guid, entries));
    } else if (node instanceof CompoundStatement) {
        console.log(mkrecord(node.guid, [
            { name: "type", label: "CompoundStatement" },
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
            console.log(mkrecord(node.guid, entries));
        } else {
            console.log(mkrecord(node.guid, [
                { name: "statement_text", label: node.statement_text },
                { name: "expression", label: "<nonterminal>" }
            ]));
        }
    } else if (node instanceof AsmStatement) {
        console.log(mkrecord(node.guid, [{ name: "statement_text", label: node.statement_text }]))
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
    } else if (node instanceof NumericLiteralExpression) {
        entries.push({ name: "value", label: `${node.value}` });
    } else if (node instanceof SpecifyExpression) {
        console.log(`    n${node.guid} -> n${node.sub.guid}`);
        PrintExpression(node.sub);
    } else {
        console.error(`  (tried to graphviz unknown expression type ${node.constructor.name})`);
    }

    console.log(mkrecord(node.guid, entries));
}

function mklabel(entries: { name: string, label: string }[]): string {
    return entries.map(x => `<n${x.name}>${x.label
        .replaceAll("<", "&#60;")
        .replaceAll(">", "&#62;")
        .replaceAll("|", "&#124;")}`).join(" | ");
}

function mkrecord(name: string, entries: { name: string, label: string }[]): string {
    return `    n${name} [shape=Mrecord label="${mklabel(entries)}"];\n`;
}