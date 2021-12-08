package dev.m0rg.howl.llvm;

import static org.bytedeco.llvm.global.LLVM.*;

public class LLVMUndefinedValue extends LLVMValue {
    public LLVMUndefinedValue(LLVMType t) {
        obj = LLVMGetUndef(t.getInternal());
    }
}
