package dev.m0rg.howl.llvm;

import org.bytedeco.llvm.LLVM.LLVMTypeRef;

public abstract class LLVMType {
    LLVMTypeRef obj;

    public final LLVMTypeRef getInternal() {
        return obj;
    }
}
