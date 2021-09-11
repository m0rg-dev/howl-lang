export interface Synthesizable {
    synthesize(): string;
}

var LLVM_COUNTER = 1;
export function count(): number {
    return LLVM_COUNTER++;
}
export function reset(): void {
    LLVM_COUNTER = 1;
}