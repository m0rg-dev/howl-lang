package dev.m0rg.howl.llvm;

import org.bytedeco.llvm.LLVM.LLVMValueRef;
import static org.bytedeco.llvm.global.LLVM.*;

public class LLVMConstant extends LLVMValue {
    public LLVMConstant(LLVMValueRef obj) {
        this.obj = obj;
    }

    public LLVMConstant cast(LLVMPointerType<LLVMType> target) {
        return new LLVMConstant(LLVMConstPointerCast(obj, target.getInternal()));
    }
}
