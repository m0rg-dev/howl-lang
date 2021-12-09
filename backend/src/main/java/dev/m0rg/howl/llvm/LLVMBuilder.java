package dev.m0rg.howl.llvm;

import static org.bytedeco.llvm.global.LLVM.*;

import java.lang.ref.WeakReference;
import java.util.List;

import org.bytedeco.javacpp.Pointer;
import org.bytedeco.javacpp.PointerPointer;
import org.bytedeco.llvm.LLVM.LLVMBuilderRef;
import org.bytedeco.llvm.LLVM.LLVMValueRef;

public class LLVMBuilder implements AutoCloseable {
    LLVMBuilderRef obj;
    WeakReference<LLVMModule> module;

    public LLVMBuilder(LLVMModule module) {
        obj = LLVMCreateBuilderInContext(module.getContext().getInternal());
        this.module = new WeakReference<LLVMModule>(module);
    }

    public final LLVMBuilderRef getInternal() {
        return obj;
    }

    public LLVMContext getContext() {
        return this.getModule().getContext();
    }

    public LLVMModule getModule() {
        return module.get();
    }

    public void positionAtEnd(LLVMBasicBlock block) {
        LLVMPositionBuilderAtEnd(this.getInternal(), block.getInternal());
    }

    public void close() {
        LLVMDisposeBuilder(obj);
    }

    public LLVMValue buildAlloca(LLVMType type, String name) {
        return LLVMValue.build(this.getModule(), LLVMBuildAlloca(this.getInternal(), type.getInternal(), name));
    }

    public LLVMValue buildBitcast(LLVMValue source, LLVMType type, String name) {
        return LLVMValue.build(this.getModule(),
                LLVMBuildBitCast(this.getInternal(), source.getInternal(), type.getInternal(), name));
    }

    public LLVMValue buildCall(LLVMValue f, List<LLVMValue> args, String name) {
        LLVMType source_type = f.getType();
        if (!(source_type instanceof LLVMPointerType)) {
            throw new IllegalArgumentException("attempt to call non-pointer type " + source_type.getClass().getName());
        }

        @SuppressWarnings("unchecked")
        LLVMType inner_type = ((LLVMPointerType<LLVMType>) source_type).getInner();
        if (!(inner_type instanceof LLVMFunctionType)) {
            f.dump();
            throw new IllegalArgumentException(
                    "attempt to call non-function-pointer type * " + source_type.getClass().getName());
        }

        PointerPointer<Pointer> args_raw = new PointerPointer<>(args.size());
        for (int i = 0; i < args.size(); i++) {
            args_raw.put(i, args.get(i).getInternal());
        }
        return LLVMValue.build(this.getModule(),

                LLVMBuildCall(this.getInternal(), f.getInternal(), args_raw, args.size(), name));
    }

    public LLVMValue buildStructGEP(LLVMType element_type, LLVMValue source, int idx, String name) {
        return LLVMValue.build(this.getModule(),
                LLVMBuildStructGEP2(this.getInternal(), element_type.getInternal(), source.getInternal(), idx, name));
    }

    public LLVMValue buildLoad(LLVMValue source, String name) {
        return LLVMValue.build(this.getModule(), LLVMBuildLoad(this.getInternal(), source.getInternal(), name));
    }

    public LLVMValue buildReturn() {
        return LLVMValue.build(this.getModule(), LLVMBuildRetVoid(this.getInternal()));
    }

    public LLVMValue buildReturn(LLVMValue source) {
        return LLVMValue.build(this.getModule(), LLVMBuildRet(this.getInternal(), source.getInternal()));
    }

    public LLVMValue buildStore(LLVMValue source, LLVMValue dest) {
        return LLVMValue.build(this.getModule(),
                LLVMBuildStore(this.getInternal(), source.getInternal(), dest.getInternal()));
    }

    public LLVMValue buildTruncOrBitCast(LLVMValue source, LLVMType dest, String name) {
        return LLVMValue.build(this.getModule(),
                LLVMBuildTruncOrBitCast(this.getInternal(), source.getInternal(), dest.getInternal(), name));
    }

    public LLVMValue buildSizeofHack(LLVMType el) {
        LLVMType p = new LLVMPointerType<>(el);
        PointerPointer<Pointer> crud = new PointerPointer<>(1);
        crud.put(0, LLVMConstInt(LLVMInt32Type(), 1, 0));
        LLVMValueRef sizeptr = LLVMBuildGEP2(this.getInternal(), el.getInternal(), LLVMConstNull(p.getInternal()), crud,
                1, "");
        return LLVMValue.build(this.getModule(), LLVMBuildPtrToInt(this.getInternal(), sizeptr, LLVMInt32Type(), ""));
    }
}
