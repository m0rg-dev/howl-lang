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

    public LLVMInstruction buildAdd(LLVMValue lhs, LLVMValue rhs, String name) {
        return new LLVMInstruction(
                LLVMBuildAdd(this.getInternal(), lhs.getInternal(), rhs.getInternal(), name));
    }

    public LLVMInstruction buildAlloca(LLVMType type, String name) {
        return new LLVMInstruction(LLVMBuildAlloca(this.getInternal(), type.getInternal(), name));
    }

    public LLVMInstruction buildBitcast(LLVMValue source, LLVMType type, String name) {
        return new LLVMInstruction(
                LLVMBuildBitCast(this.getInternal(), source.getInternal(), type.getInternal(), name));
    }

    public LLVMInstruction buildBr(LLVMBasicBlock dest) {
        return new LLVMInstruction(LLVMBuildBr(this.getInternal(), dest.getInternal()));
    }

    public LLVMInstruction buildCall(LLVMValue f, List<LLVMValue> args, String name) {
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
        return new LLVMInstruction(
                LLVMBuildCall(this.getInternal(), f.getInternal(), args_raw, args.size(), name));
    }

    public LLVMInstruction buildCondBr(LLVMValue cond, LLVMBasicBlock true_branch, LLVMBasicBlock false_branch) {
        return new LLVMInstruction(LLVMBuildCondBr(this.getInternal(), cond.getInternal(),
                true_branch.getInternal(), false_branch.getInternal()));
    }

    public LLVMInstruction buildGEP(LLVMType type, LLVMValue source, List<LLVMValue> indices, String name) {
        PointerPointer<Pointer> indices_raw = new PointerPointer<>(indices.size());
        for (int i = 0; i < indices.size(); i++) {
            indices_raw.put(i, indices.get(i).getInternal());
        }
        return new LLVMInstruction(LLVMBuildGEP2(this.getInternal(), type.getInternal(), source.getInternal(),
                indices_raw, indices.size(), name));
    }

    public LLVMInstruction buildICmp(LLVMIntPredicate op, LLVMValue lhs, LLVMValue rhs, String name) {
        return new LLVMInstruction(
                LLVMBuildICmp(this.getInternal(), op.value, lhs.getInternal(), rhs.getInternal(), name));
    }

    public LLVMInstruction buildLoad(LLVMValue source, String name) {
        return new LLVMInstruction(LLVMBuildLoad(this.getInternal(), source.getInternal(), name));
    }

    public LLVMInstruction buildMul(LLVMValue lhs, LLVMValue rhs, String name) {
        return new LLVMInstruction(
                LLVMBuildMul(this.getInternal(), lhs.getInternal(), rhs.getInternal(), name));
    }

    public LLVMInstruction buildReturn() {
        return new LLVMInstruction(LLVMBuildRetVoid(this.getInternal()));
    }

    public LLVMInstruction buildReturn(LLVMValue source) {
        return new LLVMInstruction(LLVMBuildRet(this.getInternal(), source.getInternal()));
    }

    public LLVMInstruction buildSDiv(LLVMValue lhs, LLVMValue rhs, String name) {
        return new LLVMInstruction(
                LLVMBuildSDiv(this.getInternal(), lhs.getInternal(), rhs.getInternal(), name));
    }

    public LLVMInstruction buildSExt(LLVMValue source, LLVMType dest, String name) {
        return new LLVMInstruction(
                LLVMBuildSExt(this.getInternal(), source.getInternal(), dest.getInternal(), name));
    }

    public LLVMInstruction buildSRem(LLVMValue lhs, LLVMValue rhs, String name) {
        return new LLVMInstruction(
                LLVMBuildSRem(this.getInternal(), lhs.getInternal(), rhs.getInternal(), name));
    }

    public LLVMInstruction buildStructGEP(LLVMType element_type, LLVMValue source, int idx, String name) {
        return new LLVMInstruction(
                LLVMBuildStructGEP2(this.getInternal(), element_type.getInternal(), source.getInternal(), idx, name));
    }

    public LLVMInstruction buildStore(LLVMValue source, LLVMValue dest) {
        return new LLVMInstruction(
                LLVMBuildStore(this.getInternal(), source.getInternal(), dest.getInternal()));
    }

    public LLVMInstruction buildSub(LLVMValue lhs, LLVMValue rhs, String name) {
        return new LLVMInstruction(
                LLVMBuildSub(this.getInternal(), lhs.getInternal(), rhs.getInternal(), name));
    }

    public LLVMInstruction buildTrunc(LLVMValue source, LLVMType dest, String name) {
        return new LLVMInstruction(
                LLVMBuildTrunc(this.getInternal(), source.getInternal(), dest.getInternal(), name));
    }

    public LLVMInstruction buildSizeofHack(LLVMType el) {
        LLVMType p = new LLVMPointerType<>(el);
        PointerPointer<Pointer> crud = new PointerPointer<>(1);
        crud.put(0, LLVMConstInt(LLVMInt32Type(), 1, 0));
        LLVMValueRef sizeptr = LLVMBuildGEP2(this.getInternal(), el.getInternal(), LLVMConstNull(p.getInternal()), crud,
                1, "");
        return new LLVMInstruction(LLVMBuildPtrToInt(this.getInternal(), sizeptr, LLVMInt64Type(), ""));
    }
}
