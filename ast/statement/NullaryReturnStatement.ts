import { StatementElement } from "../StatementElement";


export class NullaryReturnStatement extends StatementElement {
    clone() {
        return new NullaryReturnStatement(this.source_location);
    }

    toString() {
        return `return;`;
    }
}
