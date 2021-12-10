package dev.m0rg.howl.llvm;

import static org.bytedeco.llvm.global.LLVM.*;

import org.bytedeco.llvm.LLVM.LLVMTypeRef;

public class LLVMPointerType<T extends LLVMType> extends LLVMType {
    public LLVMPointerType(T inner) {
        obj = LLVMPointerType(inner.getInternal(), 0);
    }

    public LLVMPointerType(LLVMTypeRef obj) {
        this.obj = obj;
    }

    public LLVMType getInner() {
        return LLVMType.build(LLVMGetElementType(obj));
    }

    public LLVMConstant getNull() {
        return new LLVMConstant(LLVMConstNull(obj));
    }
}