package dev.m0rg.howl.llvm;

import static org.bytedeco.llvm.global.LLVM.*;

public class LLVMPointerType<T extends LLVMType> extends LLVMType {
    public LLVMPointerType(T inner) {
        obj = LLVMPointerType(inner.getInternal(), 0);
    }
}