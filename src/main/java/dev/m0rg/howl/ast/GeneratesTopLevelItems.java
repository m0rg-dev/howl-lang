package dev.m0rg.howl.ast;

import dev.m0rg.howl.llvm.LLVMModule;

public interface GeneratesTopLevelItems {
    public void generate(LLVMModule module);
}
