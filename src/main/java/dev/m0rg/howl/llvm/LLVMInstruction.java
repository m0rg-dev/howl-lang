package dev.m0rg.howl.llvm;

import static org.bytedeco.llvm.global.LLVM.*;

import org.bytedeco.llvm.LLVM.LLVMValueRef;

public class LLVMInstruction extends LLVMValue {
    public LLVMInstruction(LLVMValueRef obj) {
        this.obj = obj;
    }

    public boolean isTerminator() {
        return LLVMIsATerminatorInst(obj) != null;
    }
}
