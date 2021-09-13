import { TokenType } from "../lexer/TokenType";
import { ASTElement, isAstElement } from "../unified_parser/ASTElement";
import { ClassConstruct, CompoundStatement, FunctionConstruct, ModuleConstruct, PartialClassConstruct, SimpleStatement } from "../unified_parser/Parser";

/*
export function PrintExpression(node: ASTElement) {
    const entries = [
        { name: "expression", label: node.constructor.name },
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
    } else if (node instanceof DereferenceExpression) {
        entries.push({ name: "sub", label: "source" });
        console.log(`    n${node.guid}:nsub -> n${node.sub.guid}`);
        PrintExpression(node.sub);
    } else if (node instanceof VoidExpression) {
    } else if (node instanceof ModuleConstruct) {
        entries.push({ name: "name", label: node.name});
    } else if (node instanceof PartialClassConstruct) {
        entries.push({ name: "name", label: node.name});
    } else {
        console.error(`  (tried to graphviz unknown expression type ${node.constructor.name})`);
    }

    console.log(mrecord(node.guid, entries));
}
*/

export function PrintExpression(node: ASTElement) {
    const entries = [
        { name: "expression", label: node.toString() },
    ];
    if (node instanceof ClassConstruct) {
        node.fields.forEach(x => entries.push({ name: x.name, label: `${x.name}<${x.type.toString()}>` }));
        node.methods.forEach(x => {
            entries.push({ name: x.name, label: `${x.name}<${x.returnType.toString()}>(${x.args.map(x => `${x.name}<${x.type.toString()}>`).join(", ")})` });
            console.log(link(node.guid, x.name, x.guid, "expression"));
            PrintExpression(x);
        });
    } else if (node instanceof FunctionConstruct) {
        node.args.forEach(x => entries.push({ name: x.name, label: `arg: ${x.name}<${x.type.toString()}>` }));
        if (node.body) {
            entries.push({ name: "body", label: "Body" });
            console.log(link(node.guid, "body", node.body.guid, "expression"));
            PrintExpression(node.body);
        }
    } else if (node instanceof CompoundStatement) {
        node.substatements.forEach(x => {
            entries.push({ name: x.guid, label: x.toString() });
            console.log(link(node.guid, x.guid, x.guid, "expression"));
            PrintExpression(x);
        });
    } else if (node instanceof SimpleStatement) {
        node.source.forEach((x, y) => {
            if (isAstElement(x)) {
                entries.push({ name: `${y}`, label: x.toString() });
            } else {
                entries.push({ name: `${y}`, label: x.text });
            }
        });
    }

    console.log(mrecord(node.guid, entries));
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

function link(src: string, srcport: string, dest: string, destport: string): string {
    return `    n${src}${srcport ? `:n${srcport}` : ""} -> n${dest}${destport ? `:n${destport}` : ""}`;
}