package dev.m0rg.howl.llvm;

import org.bytedeco.llvm.LLVM.LLVMValueRef;

public abstract class LLVMValue {
    LLVMValueRef obj;

    public final LLVMValueRef getInternal() {
        return obj;
    }
}
