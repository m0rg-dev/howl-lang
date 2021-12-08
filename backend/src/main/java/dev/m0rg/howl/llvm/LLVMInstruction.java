package dev.m0rg.howl.llvm;

import org.bytedeco.llvm.LLVM.LLVMValueRef;

public class LLVMInstruction extends LLVMValue {
    public LLVMInstruction(LLVMValueRef obj) {
        this.obj = obj;
    }
}
