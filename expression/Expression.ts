import { ASTElement } from "../unified_parser/ASTElement";


export abstract class Expression extends ASTElement {
    abstract inferTypes(): void;

    // location should contain a pointer to this.valueType().
    synthesize(): { code: string; location: string; } {
        return { code: `;; ${this.toString()}`, location: "%INVALID" };
    }
}
