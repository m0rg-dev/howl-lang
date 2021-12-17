package dev.m0rg.howl.llvm;

import java.lang.ref.WeakReference;

import org.bytedeco.llvm.LLVM.LLVMBasicBlockRef;

import static org.bytedeco.llvm.global.LLVM.*;

public class LLVMBasicBlock {
    LLVMBasicBlockRef obj;
    WeakReference<LLVMModule> module;

    public LLVMBasicBlock(LLVMModule module, LLVMBasicBlockRef obj) {
        this.obj = obj;
        this.module = new WeakReference<LLVMModule>(module);
    }

    public LLVMBasicBlock(LLVMModule module, String name) {
        this.module = new WeakReference<LLVMModule>(module);
        this.obj = LLVMCreateBasicBlockInContext(module.getContext().getInternal(), name);
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

    public boolean hasTerminator() {
        return LLVMGetBasicBlockTerminator(obj) != null;
    }
}
