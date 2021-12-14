package dev.m0rg.howl.llvm;

import static org.bytedeco.llvm.global.LLVM.*;

import java.lang.ref.WeakReference;

import org.bytedeco.llvm.LLVM.LLVMValueRef;

public class LLVMFunction extends LLVMConstant {
    final WeakReference<LLVMModule> module;

    public LLVMFunction(LLVMModule context, LLVMValueRef obj) {
        super(obj);
        this.module = new WeakReference<>(context);
    }

    public LLVMFunction(LLVMModule module, String name, LLVMFunctionType type) {
        super(LLVMAddFunction(module.getInternal(), name, type.getInternal()));
        LLVMSetFunctionCallConv(this.getInternal(), LLVMCCallConv);
        this.module = new WeakReference<>(module);
    }

    public LLVMContext getContext() {
        return this.module.get().getContext();
    }

    public LLVMModule getModule() {
        return this.module.get();
    }

    public void setExternal() {
        LLVMSetLinkage(obj, LLVMExternalLinkage);
    }

    public boolean isExternal() {
        return LLVMIsDeclaration(obj) > 0;
    }

    public LLVMValue getParam(int index) {
        int count = LLVMCountParams(obj);
        if (index < 0 || index >= count) {
            throw new ArrayIndexOutOfBoundsException(index);
        }
        return LLVMValue.build(this.module.get(), LLVMGetParam(this.getInternal(), index));
    }

    public LLVMBasicBlock appendBasicBlock(String name) {
        return new LLVMBasicBlock(this.module.get(),
                LLVMAppendBasicBlockInContext(this.getContext().getInternal(), this.getInternal(), name));
    }

    public LLVMBasicBlock lastBasicBlock() {
        return new LLVMBasicBlock(this.module.get(), LLVMGetLastBasicBlock(this.getInternal()));
    }
}
