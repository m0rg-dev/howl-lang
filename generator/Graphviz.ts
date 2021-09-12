import { AsmStatement } from "../ast/AsmStatement";
import { ASTElement } from "../ast/ASTElement";
import { Class } from "../ast/Class";
import { CompoundStatement } from "../ast/CompoundStatement";
import { FunctionDefinition } from "../ast/FunctionDefinition";
import { Program } from "../ast/Program";
import { SimpleStatement } from "../ast/SimpleStatement";

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
    } else if (node instanceof SimpleStatement || node instanceof AsmStatement) {
        console.log(mkrecord(node.guid, [{ name: "statement_text", label: node.statement_text }]))
    } else {
        console.error(`  (tried to graphviz unknown type ${node.constructor.name})`);
    }
}

function mklabel(entries: { name: string, label: string }[]): string {
    return entries.map(x => `<n${x.name}>${x.label.replaceAll("<", "&#60;").replaceAll(">", "&#62;")}`).join(" | ");
}

function mkrecord(name: string, entries: { name: string, label: string }[]): string {
    return `    n${name} [shape=Mrecord label="${mklabel(entries)}"];\n`;
}