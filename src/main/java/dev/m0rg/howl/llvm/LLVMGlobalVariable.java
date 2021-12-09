package dev.m0rg.howl.llvm;

import org.bytedeco.llvm.LLVM.LLVMValueRef;
import static org.bytedeco.llvm.global.LLVM.*;

// TODO there are actually a couple more layers of inheritance
public class LLVMGlobalVariable extends LLVMConstant {
    public LLVMGlobalVariable(LLVMValueRef obj) {
        super(obj);
    }

    public void setInitializer(LLVMConstant initializer) {
        LLVMSetInitializer(this.getInternal(), initializer.getInternal());
    }
}
