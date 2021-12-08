package dev.m0rg.howl.llvm;

import static org.bytedeco.llvm.global.LLVM.*;

public class LLVMIntType extends LLVMType {
    public LLVMIntType(LLVMContext context, int width) {
        obj = LLVMIntTypeInContext(context.getInternal(), width);
    }

    public LLVMValue getConstant(LLVMModule module, int value) {
        return LLVMValue.build(module, LLVMConstInt(this.obj, value, 0));
    }
}
