package dev.m0rg.howl.llvm;

import static org.bytedeco.llvm.global.LLVM.*;

public class LLVMVoidType extends LLVMType {
    public LLVMVoidType(LLVMContext context) {
        obj = LLVMVoidTypeInContext(context.getInternal());
    }
}
