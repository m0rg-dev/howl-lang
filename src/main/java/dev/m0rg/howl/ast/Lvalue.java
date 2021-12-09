package dev.m0rg.howl.ast;

import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMValue;

public interface Lvalue {
    public LLVMValue getPointer(LLVMBuilder builder);
}
