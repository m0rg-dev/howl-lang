package dev.m0rg.howl.llvm;

import static org.bytedeco.llvm.global.LLVM.*;

public class LLVMFunction extends LLVMValue {
    public LLVMFunction(LLVMModule module, String name, LLVMFunctionType type) {
        this.obj = LLVMAddFunction(module.getInternal(), name, type.getInternal());
    }
}
