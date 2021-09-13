import { FunctionType } from "../unified_parser/TypeObject";
import { ASTElement, isAstElement, TokenStream } from "../unified_parser/ASTElement";
import { ClassConstruct, CompoundStatement, FunctionConstruct, ModuleConstruct, PartialClassConstruct } from "../unified_parser/Parser";
import { AssignmentStatement, SimpleStatement, UnaryReturnStatement } from "../unified_parser/SimpleStatement";
import { FunctionCallExpression, MethodReferenceExpression } from "../unified_parser/TypedElement";
import { FieldReferenceExpression } from "../unified_parser/FieldReferenceExpression";

export function PrintAST(stream: TokenStream): string {
    let s = "digraph{\n    rankdir=LR;";
    stream.forEach((x) => {
        if (!(x instanceof ASTElement)) return;
        s += PrintExpression(x);
    });
    s += "}\n";
    return s;
}

export function PrintExpression(node: ASTElement): string {
    let s = "";
    const entries = [
        { name: "expression", label: node.constructor.name },
        { name: "own_text", label: `"${node}"` },
    ];

    entries.push({ name: "type", label: `type: ${node.value_type}` });

    if (node.scope && node.hasOwnScope) {
        entries.push({ name: "scope", label: "scope" });
        s += link(node.guid, "scope", node.scope.guid, undefined);
        const sub_entries: { name: string, label: string }[] = [];
        if (node.scope.parent && node.scope.parent.scope && node.scope.parent.hasOwnScope) {
            s += revlink(node.scope.guid, undefined, node.scope.parent.scope.guid, undefined);
        }
        for (const [k, v] of node.scope.locals) {
            sub_entries.push({ name: k, label: `${v} ${k}` });
        }
        if (node.scope.return_type) {
            sub_entries.push({ name: "__return", label: `return: ${node.scope.return_type}` })
        }
        s += record(node.scope.guid, sub_entries);
    }

    if (node instanceof ClassConstruct) {
        node.fields.forEach(x => entries.push({ name: x.name, label: `${x.name}<${x.value_type.toString()}>` }));
        node.methods.forEach(x => {
            entries.push({ name: x.name, label: `${x.name}<${x.return_type_literal.value_type.toString()}>(${x.args.map(x => `${x.name}<${x.type_literal.value_type.toString()}>`).join(", ")})` });
            s += link(node.guid, x.name, x.guid, "expression");
            s += PrintExpression(x);
        });
    } else if (node instanceof FunctionConstruct) {
        node.args.forEach(x => entries.push({ name: x.name, label: `arg: ${x.name}<${x.type_literal.value_type.toString()}>` }));
        if (node.body) {
            entries.push({ name: "body", label: "Body" });
            s += link(node.guid, "body", node.body.guid, "expression");
            s += PrintExpression(node.body);
        }
    } else if (node instanceof CompoundStatement) {
        node.substatements.forEach(x => {
            entries.push({ name: x.guid, label: x.toString() });
            s += link(node.guid, x.guid, x.guid, "expression");
            s += PrintExpression(x);
        });
    } else if (node instanceof SimpleStatement) {
        node.source.forEach((x, y) => {
            if (isAstElement(x)) {
                entries.push({ name: `${y}`, label: x.toString() });
                s += link(node.guid, `${y}`, x.guid, "expression");
                s += PrintExpression(x);
            } else {
                entries.push({ name: `${y}`, label: x.text });
            }
        });
    } else if (node instanceof AssignmentStatement) {
        entries.push({ name: "lhs", label: `lhs <${node.expression.lhs.value_type}>` });
        entries.push({ name: "rhs", label: `rhs <${node.expression.rhs.value_type}>` });
        s += link(node.guid, "lhs", node.expression.lhs.guid, "expression");
        s += link(node.guid, "rhs", node.expression.rhs.guid, "expression");
        s += PrintExpression(node.expression.lhs);
        s += PrintExpression(node.expression.rhs);
    } else if (node instanceof UnaryReturnStatement) {
        if (node.scope.get_return()) {
            entries.push({ name: "value", label: `value <${node.scope.get_return()}>` });
        } else {
            entries.push({ name: "value", label: "value" });
        }
        s += link(node.guid, "value", node.expression.source.guid, "expression");
        s += PrintExpression(node.expression.source);
    } else if (node instanceof FieldReferenceExpression) {
        entries.push({ name: "source", label: "source" });
        entries.push({ name: "index", label: `index: ${node.index()}` });
        s += link(node.guid, "source", node.source.guid, "expression");
        s += PrintExpression(node.source);
    } else if (node instanceof FunctionCallExpression) {
        entries.push({ name: "function", label: "function" });
        s += link(node.guid, "function", node.source.guid, "expression");
        s += PrintExpression(node.source);
        if (node.source.value_type instanceof FunctionType) {
            node.args.forEach((x, y) => {
                entries.push({ name: `arg${y}`, label: `argument ${y} <${(node.source.value_type as FunctionType).args[y]}>` });
                s += link(node.guid, `arg${y}`, x.guid, "expression");
                s += PrintExpression(x);
            })
        } else {
            entries.push({ name: "err", label: `no args? type is ${node.source.value_type}` });
        }
    }

    s += mrecord(node.guid, entries);
    return s;
}

function mklabel(entries: { name: string, label: string }[]): string {
    return entries.map(x => `<n${x.name}>${x.label
        .replaceAll("<", "&#60;")
        .replaceAll(">", "&#62;")
        .replaceAll('"', "&#34;")
        .replaceAll("{", "&#123;")
        .replaceAll("}", "&#125;")
        .replaceAll("|", "&#124;")}`).join(" | ");
}

function mrecord(name: string, entries: { name: string, label: string }[]): string {
    return `    n${name} [shape=Mrecord label="${mklabel(entries)}"];\n`;
}

function record(name: string, entries: { name: string, label: string }[]): string {
    return `    n${name} [shape=record label="${mklabel(entries)}"];\n`;
}

function link(src: string, srcport: string, dest: string, destport: string): string {
    return `    n${src}${srcport ? `:n${srcport}` : ""} -> n${dest}${destport ? `:n${destport}` : ""}\n`;
}

function revlink(src: string, srcport: string, dest: string, destport: string): string {
    return `    n${dest}${destport ? `:n${destport}` : ""} -> n${src}${srcport ? `:n${srcport}` : ""} [dir=back]\n`;
}