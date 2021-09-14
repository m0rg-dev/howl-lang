import { FunctionType, TypeObject } from "../unified_parser/TypeObject";
import { ASTElement, isAstElement, TokenStream } from "../unified_parser/ASTElement";
import { ModuleConstruct, PartialClassConstruct } from "../unified_parser/Parser";
import { CompoundStatement } from "../unified_parser/CompoundStatement";
import { FunctionConstruct } from "../unified_parser/FunctionConstruct";
import { ClassConstruct } from "../unified_parser/ClassConstruct";
import { SimpleStatement } from "../unified_parser/SimpleStatement";
import { AssignmentStatement } from "../unified_parser/AssignmentStatement";
import { UnaryReturnStatement } from "../unified_parser/UnaryReturnStatement";
import { MethodReferenceExpression } from "../unified_parser/TypedElement";
import { FunctionCallExpression } from "../unified_parser/FunctionCallExpression";
import { FieldReferenceExpression } from "../unified_parser/FieldReferenceExpression";
import { StaticTableInitialization } from "../unified_parser/StaticTableInitialization";
import { StaticInitializer } from "../registry/StaticVariableRegistry";
import { TypeRequest } from "../unified_parser/TypeRequest";
import { isSynthesizable } from "./IR";
import { RawPointerIndexExpression } from "../unified_parser/RawPointerIndexExpression";
import { IfStatement } from "../unified_parser/IfStatement";
import { ComparisonExpression } from "../unified_parser/ComparisonExpression";
import { ArithmeticExpression } from "../unified_parser/ArithmeticExpression";

export function PrintAST(stream: TokenStream): string {
    const revstream = [...stream];
    revstream.reverse();
    let s = "digraph{\n    rankdir=LR;";
    revstream.forEach((x) => {
        if (!(x instanceof ASTElement)) return;
        s += PrintExpression(x);
    });
    s += "}\n";
    return s;
}

export function PrintStaticVariable(name: string, type: TypeObject, initializer?: StaticInitializer): string {
    let s = record(name, [{ name: "name", label: name }, { name: "type", label: type.toString() }]);
    if (initializer) {
        if (initializer instanceof StaticTableInitialization) {
            const entries: { name: string, label: string }[] = [];
            initializer.fields.forEach((x, y) => {
                entries.push({ name: `f${y}`, label: `${y}<${x.value_type.toString()}>: ${x.name}` });
            })
            s += record(`static_init_${name}`, entries);
            s += link(name, undefined, `static_init_${name}`, undefined);
        }

        if (isSynthesizable(initializer)) {
            const block = initializer.synthesize();
            const ir_entries: { name: string, label: string }[] = [];
            if (block.output_location) {
                ir_entries.push({ name: "location", label: `loc: ${block.output_location.location}\\l` });
                ir_entries.push({ name: "type", label: `type: ${block.output_location.type.toString()}\\l` });
    
            }
            block.statements.forEach(x => ir_entries.push({ name: "st", label: x.toString() + "\\l" }));
            s += mrecord(`static_init_${name}` + `_ir`, ir_entries, "color=gray, fontcolor=gray");
            s += link(`static_init_${name}`, undefined, `static_init_${name}` + `_ir`, undefined);
        }
    }
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
            s += link(node.guid, x.name, x.guid, undefined);
            s += PrintExpression(x);
        });
    } else if (node instanceof FunctionConstruct) {
        node.args.forEach(x => entries.push({ name: x.name, label: `arg: ${x.name}<${x.type_literal.value_type.toString()}>` }));
        if (node.body) {
            entries.push({ name: "body", label: "Body" });
            s += link(node.guid, "body", node.body.guid, undefined);
            s += PrintExpression(node.body);
        }
    } else if (node instanceof CompoundStatement) {
        node.substatements.forEach(x => {
            entries.push({ name: x.guid, label: x.toString() });
            s += link(node.guid, x.guid, x.guid, undefined);
            s += PrintExpression(x);
        });
    } else if (node instanceof SimpleStatement) {
        node.source.forEach((x, y) => {
            if (isAstElement(x)) {
                entries.push({ name: `${y}`, label: x.toString() });
                s += link(node.guid, `${y}`, x.guid, undefined);
                s += PrintExpression(x);
            } else {
                entries.push({ name: `${y}`, label: x.text });
            }
        });
    } else if (node instanceof AssignmentStatement) {
        entries.push({ name: "lhs", label: `lhs <${node.expression.lhs.value_type}>` });
        entries.push({ name: "rhs", label: `rhs <${node.expression.rhs.value_type}>` });
        s += link(node.guid, "lhs", node.expression.lhs.guid, undefined);
        s += link(node.guid, "rhs", node.expression.rhs.guid, undefined);
        s += PrintExpression(node.expression.lhs);
        s += PrintExpression(node.expression.rhs);
    } else if (node instanceof UnaryReturnStatement) {
        if (node.scope.get_return()) {
            entries.push({ name: "value", label: `value <${node.scope.get_return()}>` });
        } else {
            entries.push({ name: "value", label: "value" });
        }
        s += link(node.guid, "value", node.expression.source.guid, undefined);
        s += PrintExpression(node.expression.source);
    } else if (node instanceof FieldReferenceExpression) {
        entries.push({ name: "source", label: "source" });
        entries.push({ name: "index", label: `index: ${node.index()}` });
        s += link(node.guid, "source", node.source.guid, undefined);
        s += PrintExpression(node.source);
    } else if (node instanceof FunctionCallExpression) {
        entries.push({ name: "function", label: "function" });
        s += link(node.guid, "function", node.source.guid, undefined);
        s += PrintExpression(node.source);
        if (node.source.value_type instanceof FunctionType) {
            node.args.forEach((x, y) => {
                entries.push({ name: `arg${y}`, label: `argument ${y} <${(node.source.value_type as FunctionType).args[y]}>` });
                s += link(node.guid, `arg${y}`, x.guid, undefined);
                s += PrintExpression(x);
            })
        } else {
            entries.push({ name: "err", label: `no args? type is ${node.source.value_type}` });
        }
    } else if (node instanceof TypeRequest) {
        entries.push({ name: "source", label: "source" });
        s += link(node.guid, "source", node.source.guid, undefined);
        s += PrintExpression(node.source);
    } else if (node instanceof RawPointerIndexExpression) {
        entries.push({ name: "source", label: "source" });
        s += link(node.guid, "source", node.source.guid, undefined);
        s += PrintExpression(node.source);
        entries.push({ name: "index", label: "index" });
        s += link(node.guid, "index", node.index.guid, undefined);
        s += PrintExpression(node.index);
    } else if(node instanceof IfStatement) {
        entries.push({ name: "condition", label: "condition" });
        s += link(node.guid, "condition", node.condition.guid, undefined);
        s += PrintExpression(node.condition);
        entries.push({ name: "body", label: "body" });
        s += link(node.guid, "body", node.body.guid, undefined);
        s += PrintExpression(node.body);
    } else if (node instanceof ComparisonExpression || node instanceof ArithmeticExpression) {
        entries.push({ name: "lhs", label: `lhs <${node.lhs.value_type}>` });
        entries.push({ name: "rhs", label: `rhs <${node.rhs.value_type}>` });
        s += link(node.guid, "lhs", node.lhs.guid, undefined);
        s += link(node.guid, "rhs", node.rhs.guid, undefined);
        s += PrintExpression(node.lhs);
        s += PrintExpression(node.rhs);
    } 

    s += mrecord(node.guid, entries);

    /*
    if (isSynthesizable(node)) {
        const block = node.synthesize();
        const ir_entries: { name: string, label: string }[] = [];
        if (block.output_location) {
            ir_entries.push({ name: "location", label: `loc: ${block.output_location.location}\\l` });
            ir_entries.push({ name: "type", label: `type: ${block.output_location.type.toString()}\\l` });

        }
        block.statements.forEach(x => ir_entries.push({ name: "st", label: x.toString() + "\\l" }));
        s += mrecord(node.guid + `_ir`, ir_entries, "color=gray, fontcolor=gray");
        s += link(node.guid, undefined, node.guid + `_ir`, undefined);
    }
    */
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

function mrecord(name: string, entries: { name: string, label: string }[], opt?: string): string {
    return `    n${name} [shape=Mrecord label="${mklabel(entries)}" ${opt || ""}];\n`;
}

function record(name: string, entries: { name: string, label: string }[], opt?: string): string {
    return `    n${name} [shape=record label="${mklabel(entries)}" ${opt || ""}];\n`;
}

function link(src: string, srcport: string, dest: string, destport: string): string {
    return `    n${src}${srcport ? `:n${srcport}` : ""} -> n${dest}${destport ? `:n${destport}` : ""}\n`;
}

function revlink(src: string, srcport: string, dest: string, destport: string): string {
    return `    n${dest}${destport ? `:n${destport}` : ""} -> n${src}${srcport ? `:n${srcport}` : ""} [dir=back]\n`;
}