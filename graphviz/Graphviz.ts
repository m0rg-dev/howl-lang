import { ASTElement } from "../ast/ASTElement";
import { CompoundStatementElement } from "../ast/CompoundStatementElement";
import { FunctionElement } from "../ast/FunctionElement";
import { PartialStatementElement } from "../ast/StatementElement";
import { Scope } from "../ast/Scope";

export function RenderElement(e: ASTElement): string {
    let s: string[] = [];
    if (e instanceof FunctionElement) {
        const contents: RecordRow[] = [
            [{ text: "FunctionElement" }],
            [{ port: "name", text: "name: " + e.name }],
        ];
        s.push((new Link("u" + e.uuid, "u" + e.body.uuid)).toString());
        s.push((new RecordNode(e.uuid, contents)).toString());
        s.push(RenderElement(e.body));
    } else if (e instanceof CompoundStatementElement) {
        const contents: RecordRow[] = [
            [{ text: "CompoundStatementElement" }],
        ];
        e.statements.forEach(x => {
            contents.push([{ port: "u" + x.uuid, text: x.toString() }])
            s.push((new Link("u" + e.uuid + ":u" + x.uuid, "u" + x.uuid)).toString());
            s.push(RenderElement(x));
        });
        s.push((new RecordNode(e.uuid, contents)).toString());
    } else if (e instanceof PartialStatementElement) {
        const contents: RecordRow[] = [
            [{ text: "SimpleStatementElement" }],
        ];
        e.body.forEach(x => {
            contents.push([{ port: "u" + x.uuid, text: x.toString() }])
            s.push((new Link("u" + e.uuid + ":u" + x.uuid, "u" + x.uuid)).toString());
            s.push(RenderElement(x));
        });
        s.push((new RecordNode(e.uuid, contents)).toString());
    } else {
        s.push(`  u${e.uuid} [label="${escape(e.toString())}", shape=rect];`);
    }

    return s.join("\n");
}

export function RenderScope(scope: Scope): string {
    const contents: RecordRow[] = [
        [{ text: "Scope" }]
    ];

    scope.names.forEach((x, y) => {
        contents[y + 1] ||= [];
        contents[y + 1][0] = { text: x };
    });

    scope.types.forEach((x, y) => {
        contents[y + 1] ||= [{ text: `#${y}` }];
        contents[y + 1][1] = { text: x.toString() };
    });

    return (new RecordNode(scope.uuid, contents)).toString();
}

function escape(s: string): string {
    return s.replaceAll("\"", "&#34;");
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