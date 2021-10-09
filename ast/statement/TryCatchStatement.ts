import { SourceLocation } from "../ASTElement";
import { CompoundStatementElement } from "../CompoundStatementElement";
import { StatementElement } from "../StatementElement";
import { TypeElement } from "../TypeElement";

export type CatchCase = {
    local_name: string;
    type: TypeElement;
    body: CompoundStatementElement;
};

export class TryCatchStatement extends StatementElement {
    body: CompoundStatementElement;
    cases: CatchCase[];

    constructor(loc: SourceLocation, body: CompoundStatementElement, cases: CatchCase[]) {
        super(loc);
        this.body = body;
        this.cases = cases;
    }

    toString() {
        return `try ${this.body} ${this.cases.map(x => `catch (${x.local_name} ${x.type}) ${x.body}`)}`;
    }

    clone() {
        return new TryCatchStatement(
            this.source_location,
            this.body.clone(),
            this.cases.map(x => {
                return {
                    local_name: x.local_name,
                    type: x.type.clone(),
                    body: x.body.clone()
                }
            })
        );
    }
}