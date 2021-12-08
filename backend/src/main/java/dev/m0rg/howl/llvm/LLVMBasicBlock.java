package dev.m0rg.howl.llvm;

import java.lang.ref.WeakReference;

import org.bytedeco.llvm.LLVM.LLVMBasicBlockRef;

public class LLVMBasicBlock {
    LLVMBasicBlockRef obj;
    WeakReference<LLVMModule> module;

    public LLVMBasicBlock(LLVMModule module, LLVMBasicBlockRef obj) {
        this.obj = obj;
        this.module = new WeakReference<LLVMModule>(module);
    }

    public final LLVMBasicBlockRef getInternal() {
        return obj;
    }

    public LLVMContext getContext() {
        return module.get().getContext();
    }

    public LLVMModule getModule() {
        return module.get();
    }
}
