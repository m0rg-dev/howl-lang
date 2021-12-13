package dev.m0rg.howl.llvm;

import static org.bytedeco.llvm.global.LLVM.*;

import org.bytedeco.llvm.LLVM.LLVMTypeRef;

public class LLVMIntType extends LLVMType {
    public LLVMIntType(LLVMContext context, int width) {
        obj = LLVMIntTypeInContext(context.getInternal(), width);
    }

    public LLVMIntType(LLVMTypeRef obj) {
        this.obj = obj;
    }

    public LLVMConstant getConstant(LLVMModule module, int value) {
        return (LLVMConstant) LLVMValue.build(module, LLVMConstInt(this.obj, value, 0));
    }

    public LLVMConstant getNull(LLVMModule module) {
        return this.getConstant(module, 0);
    }
}
