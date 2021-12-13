package dev.m0rg.howl.llvm;

import static org.bytedeco.llvm.global.LLVM.*;

import java.util.ArrayList;
import java.util.List;

import org.bytedeco.javacpp.BytePointer;
import org.bytedeco.javacpp.Pointer;
import org.bytedeco.javacpp.PointerPointer;
import org.bytedeco.llvm.LLVM.LLVMTypeRef;

public class LLVMStructureType extends LLVMType {
    public LLVMStructureType(LLVMContext context, String name) {
        obj = LLVMStructCreateNamed(context.getInternal(), name);
    }

    public LLVMStructureType(LLVMTypeRef obj) {
        if (LLVMGetTypeKind(obj) != LLVMStructTypeKind) {
            throw new IllegalArgumentException();
        }
        this.obj = obj;
    }

    public LLVMStructureType(LLVMContext context, List<LLVMType> contents, boolean packed) {
        PointerPointer<Pointer> contents_raw = new PointerPointer<>(contents.size());
        for (int i = 0; i < contents.size(); i++) {
            contents_raw.put(i, contents.get(i).getInternal());
        }
        obj = LLVMStructTypeInContext(context.getInternal(), contents_raw, contents.size(), packed ? 1 : 0);
    }

    public boolean isOpaqueStruct() {
        return LLVMIsOpaqueStruct(obj) != 0;
    }

    public boolean isPacked() {
        return LLVMIsPackedStruct(obj) != 0;
    }

    public void setBody(List<LLVMType> contents, boolean packed) {
        PointerPointer<Pointer> contents_raw = new PointerPointer<>(contents.size());
        for (int i = 0; i < contents.size(); i++) {
            contents_raw.put(i, contents.get(i).getInternal());
        }
        LLVMStructSetBody(obj, contents_raw, contents.size(), packed ? 1 : 0);
    }

    public LLVMConstant createConstant(LLVMContext context, List<LLVMConstant> contents) {
        PointerPointer<Pointer> contents_raw = new PointerPointer<>(contents.size());
        for (int i = 0; i < contents.size(); i++) {
            contents_raw.put(i, contents.get(i).getInternal());
        }
        BytePointer n = LLVMGetStructName(obj);
        if (n.isNull()) {
            return new LLVMConstant(LLVMConstStructInContext(context.getInternal(), contents_raw, contents.size(),
                    this.isPacked() ? 1 : 0));
        } else {
            return new LLVMConstant(LLVMConstNamedStruct(obj, contents_raw, contents.size()));
        }
    }

    public LLVMConstant getNull(LLVMModule module) {
        List<LLVMConstant> contents = new ArrayList<>();
        int count = LLVMCountStructElementTypes(obj);
        for (int i = 0; i < count; i++) {
            contents.add(LLVMType.build(LLVMStructGetTypeAtIndex(obj, i)).getNull(module));
        }
        return this.createConstant(module.getContext(), contents);
    }
}
