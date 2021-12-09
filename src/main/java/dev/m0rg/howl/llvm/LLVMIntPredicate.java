package dev.m0rg.howl.llvm;

public enum LLVMIntPredicate {
    LLVMIntEQ(32),
    LLVMIntNE(33),
    LLVMIntUGT(34),
    LLVMIntUGE(35),
    LLVMIntULT(36),
    LLVMIntULE(37),
    LLVMIntSGT(38),
    LLVMIntSGE(39),
    LLVMIntSLT(40),
    LLVMIntSLE(41);

    public final int value;

    private LLVMIntPredicate(int value) {
        this.value = value;
    }
}
