package dev.m0rg.howl.llvm;

import org.bytedeco.llvm.LLVM.LLVMValueRef;

public class LLVMArgument extends LLVMValue {
    public LLVMArgument(LLVMValueRef obj) {
        this.obj = obj;
    }
}
