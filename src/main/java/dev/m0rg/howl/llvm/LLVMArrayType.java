package dev.m0rg.howl.llvm;

import org.bytedeco.llvm.LLVM.LLVMTypeRef;

public class LLVMArrayType extends LLVMType {
    public LLVMArrayType(LLVMTypeRef obj) {
        this.obj = obj;
    }
}
