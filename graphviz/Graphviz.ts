import { ASTElement } from "../ast/ASTElement";
import { ClassElement } from "../ast/ClassElement";
import { CompoundStatementElement } from "../ast/CompoundStatementElement";
import { ConstructorCallExpression } from "../ast/expression/ConstructorCallExpression";
import { FieldReferenceExpression } from "../ast/expression/FieldReferenceExpression";
import { FunctionCallExpression } from "../ast/expression/FunctionCallExpression";
import { NameExpression } from "../ast/expression/NameExpression";
import { NumberExpression } from "../ast/expression/NumberExpression";
import { ExpressionElement } from "../ast/ExpressionElement";
import { FunctionElement } from "../ast/FunctionElement";
import { AssignmentStatement } from "../ast/statement/AssignmentStatement";
import { SimpleStatement } from "../ast/statement/SimpleStatement";
import { UnaryReturnStatement } from "../ast/statement/UnaryReturnStatement";
import { PartialStatementElement } from "../ast/StatementElement";
import { ConsumedType } from "../type_inference/ConsumedType";
import { Scope } from "../type_inference/Scope";

export function RenderElement(e: ASTElement, _nearestScope?: Scope): string {
    let s: string[] = [];
    if (e instanceof FunctionElement) {
        const contents: RecordRow[] = [
            [{ text: "FunctionElement" }],
            [{ port: "name", text: "fqn: " + e.getFQN().toString() }],
            [{ port: "type", text: "returns: " + escape(e.return_type.toString()) }],
            [{ port: "type", text: "self: " + escape(e.self_type.toString()) }],
        ];
        e.args.forEach(x => {
            contents.push([{ port: "arg", text: x.toString() }]);
        })
        s.push((new Link("u" + e.uuid, "u" + e.body.uuid)).toString());
        s.push("{\n  rank=same");
        s.push((new RecordNode(e.uuid, contents)).toString());
        if (e.scope) {
            s.push(RenderScope(e.scope));
            s.push((new Link("u" + e.uuid, "u" + e.scope.uuid)).toString());
        }
        s.push("}");
        s.push(RenderElement(e.body, e.scope));
    } else if (e instanceof CompoundStatementElement) {
        const contents: RecordRow[] = [
            [{ text: "CompoundStatementElement" }],
        ];
        e.statements.forEach(x => {
            contents.push([{ port: "u" + x.uuid, text: x.toString() }])
            s.push((new Link("u" + e.uuid + ":u" + x.uuid, "u" + x.uuid)).toString());
            s.push(RenderElement(x, e.scope));
        });
        s.push("{\n  rank=same");
        s.push((new RecordNode(e.uuid, contents)).toString());
        if (e.scope) {
            s.push(RenderScope(e.scope));
            s.push((new Link("u" + e.uuid, "u" + e.scope.uuid)).toString());
        }
        s.push("}");
    } else if (e instanceof PartialStatementElement) {
        const contents: RecordRow[] = [
            [{ text: "SimpleStatementElement" }],
        ];
        e.body.forEach(x => {
            contents.push([{ port: "u" + x.uuid, text: x.toString() }])
            s.push((new Link("u" + e.uuid + ":u" + x.uuid, "u" + x.uuid)).toString());
            s.push(RenderElement(x, _nearestScope));
        });
        s.push((new RecordNode(e.uuid, contents)).toString());
    } else if (e instanceof AssignmentStatement) {
        const contents: RecordRow[] = [
            [{ text: "AssignmentStatement" }],
        ];
        contents.push([{ text: "lhs" }, { port: "lhs", text: e.lhs.toString() }]);
        contents.push([{ text: "rhs" }, { port: "rhs", text: e.rhs.toString() }]);
        s.push((new RecordNode(e.uuid, contents)).toString());
        s.push((new Link("u" + e.uuid + ":lhs", "u" + e.lhs.uuid)).toString());
        s.push((new Link("u" + e.uuid + ":rhs", "u" + e.rhs.uuid)).toString());
        s.push(RenderElement(e.lhs, _nearestScope));
        s.push(RenderElement(e.rhs, _nearestScope));
    } else if (e instanceof UnaryReturnStatement) {
        const contents: RecordRow[] = [
            [{ text: "UnaryReturnStatement" }],
        ];
        contents.push([{ text: "source" }, { port: "source", text: e.source.toString() }]);
        s.push((new RecordNode(e.uuid, contents)).toString());
        s.push((new Link("u" + e.uuid + ":source", "u" + e.source.uuid)).toString());
        s.push(RenderElement(e.source, _nearestScope));
    } else if (e instanceof FieldReferenceExpression) {
        const contents: RecordRow[] = [
            [{ text: "FieldReferenceExpression" }],
        ];
        contents.push([{ text: "source" }, { port: "source", text: e.source.toString() }]);
        contents.push([{ text: "field" }, { port: "field", text: e.name }]);
        s.push((new RecordNode(e.uuid, contents)).toString());
        s.push((new Link("u" + e.uuid + ":source", "u" + e.source.uuid)).toString());
        s.push(RenderElement(e.source, _nearestScope));
    } else if (e instanceof FunctionCallExpression) {
        const contents: RecordRow[] = [
            [{ text: "FunctionCallExpression" }]
        ];
        contents.push([{ text: "source" }, { port: "source", text: e.source.toString() }]);
        s.push(RenderElement(e.source, _nearestScope));
        e.args.forEach((x, y) => {
            contents.push([{ text: `arg${y}` }, { port: `arg${y}`, text: x.toString() }]);
            s.push((new Link("u" + e.uuid + `:arg${y}`, "u" + x.uuid)).toString());
            s.push(RenderElement(x, _nearestScope));
        });
        s.push((new RecordNode(e.uuid, contents)).toString());
        s.push((new Link("u" + e.uuid + ":source", "u" + e.source.uuid)).toString());
    } else if (e instanceof ConstructorCallExpression) {
        const contents: RecordRow[] = [
            [{ text: "ConstructorCallExpression" }]
        ];
        contents.push([{ text: "source" }, { port: "source", text: e.source.toString() }]);
        e.args.forEach((x, y) => {
            contents.push([{ text: `arg${y}` }, { port: `arg${y}`, text: x.toString() }]);
            s.push((new Link("u" + e.uuid + `:arg${y}`, "u" + x.uuid)).toString());
            s.push(RenderElement(x, _nearestScope));
        });
        s.push((new RecordNode(e.uuid, contents)).toString());
    } else if (e instanceof ClassElement) {
        s.push(`  u${e.uuid} [label="${escape(e.toString())}", shape=rect];`);
        e.methods.forEach(x => {
            s.push(RenderElement(x, _nearestScope));
            s.push((new Link("u" + e.uuid, "u" + x.uuid)).toString());
        })
    } else if (e instanceof NumberExpression
        || e instanceof NameExpression) {
        s.push(`  u${e.uuid} [label="${escape(e.toString())}", shape=rect];`);
    } else if (e instanceof SimpleStatement) {
        s.push(`  u${e.uuid} [label="${escape(e.toString())}", shape=rect];`);
        s.push(RenderElement(e.exp, _nearestScope));
        s.push((new Link("u" + e.uuid, "u" + e.exp.uuid)).toString());
    } else {
        s.push(`  u${e.uuid} [label="${escape(e.constructor.name)}", shape=rect];`);
    }


    if (e instanceof ExpressionElement && e.resolved_type) {
        s.push((new Link("u" + e.uuid, "type_" + e.uuid)).toString());
        s.push(`  type_${e.uuid} [label="${escape(e.resolved_type.toString())}", shape=Mrecord, color=green, fontcolor=green]`);
    } else if (e instanceof ExpressionElement && e.type_location) {
        s.push((new Link("u" + e.uuid, "type_" + e.uuid)).toString());
        s.push(`  type_${e.uuid} [label="${escape(e.type_location.toString())} = ${escape(e.type_location.get().toString())}", shape=Mrecord, color=blue, fontcolor=blue]`);
    }

    return s.join("\n");
}

export function RenderScope(scope: Scope): string {
    const contents: RecordRow[] = [
        [{ text: "Scope" }, { text: "id: " + scope.n.toString() }]
    ];

    scope.types.forEach((x, y) => {
        if (!(x instanceof ConsumedType)) {
            contents.push([{ text: scope.names[y] || `#${y}` }, { text: escape(x.toString()) }]);
        }
    });

    return (new RecordNode(scope.uuid, contents)).toString();
}

function escape(s: string): string {
    return s.replaceAll("\"", "&#34;")
        .replaceAll("&", "&#38;")
        .replaceAll("'", "&#39;")
        .replaceAll("<", "&#60;")
        .replaceAll(">", "&#62;")
        .replaceAll("{", "&#123;")
        .replaceAll("|", "&#124;")
        .replaceAll("}", "&#125;");
}

class RecordNode {
    uuid: string;
    contents: RecordRow[];

    constructor(uuid: string, contents: RecordRow[]) {
        this.uuid = uuid;
        this.contents = contents;
    }

    toString() {
        const label = "<TABLE BORDER=\"0\" CELLBORDER=\"1\" CELLSPACING=\"0\">"
            + this.contents.map(x => "<TR>" + x.map(y => "<TD PORT=\"" + y.port + "\">" + y.text + "</TD>") + "</TR>")
            + "</TABLE>";
        return `  u${this.uuid} [label=<${label}> shape=plaintext];`
    }
}

export type RecordColumn = { port?: string, text: string };
export type RecordRow = RecordColumn[];

class Link {
    source: string;
    dest: string;

    constructor(source: string, dest: string) {
        this.source = source;
        this.dest = dest;
    }

    toString() {
        return `  ${this.source} -> ${this.dest}`;
    }
}