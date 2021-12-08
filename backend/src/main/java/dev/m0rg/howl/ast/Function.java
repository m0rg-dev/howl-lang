package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map.Entry;
import java.util.Optional;

import dev.m0rg.howl.llvm.LLVMFunction;
import dev.m0rg.howl.llvm.LLVMFunctionType;
import dev.m0rg.howl.llvm.LLVMModule;

public class Function extends ASTElement implements NamedElement, NameHolder, HasOwnType {
    boolean is_static;
    String name;
    String original_name;
    TypeElement rc;
    LinkedHashMap<String, Argument> args;
    Optional<CompoundStatement> body;

    public Function(Span span, boolean is_static, String name) {
        super(span);
        this.is_static = is_static;
        this.name = this.original_name = name;
        this.args = new LinkedHashMap<String, Argument>();
        this.body = Optional.empty();
    }

    @Override
    public ASTElement detach() {
        Function rc = new Function(span, is_static, name);
        rc.setReturn((TypeElement) this.rc.detach());
        for (Entry<String, Argument> field : args.entrySet()) {
            rc.insertArgument((Argument) field.getValue().detach());
        }
        if (this.body.isPresent()) {
            rc.setBody((CompoundStatement) this.body.get().detach());
        }
        rc.original_name = original_name;
        return rc;
    }

    @Override
    public String format() {
        StringBuilder rc = new StringBuilder();
        if (this.is_static) {
            rc.append("static ");
        }
        rc.append("fn ");
        rc.append(this.rc.format() + " ");
        rc.append(this.name);
        rc.append("(");

        List<String> arg_strings = new ArrayList<String>(this.args.size());
        for (Entry<String, Argument> field : args.entrySet()) {
            arg_strings.add(field.getValue().format());
        }
        rc.append(String.join(", ", arg_strings));
        rc.append(") ");

        if (this.body.isPresent()) {
            rc.append(this.body.get().format());
        } else {
            rc.append(";");
        }
        return rc.toString();
    }

    public String getName() {
        return name;
    }

    public String getOriginalName() {
        return original_name;
    }

    public void prependArgument(Argument arg) {
        LinkedHashMap<String, Argument> new_map = new LinkedHashMap<String, Argument>();
        new_map.put(arg.getName(), (Argument) arg.setParent(this));
        for (Entry<String, Argument> field : args.entrySet()) {
            new_map.put(field.getKey(), field.getValue());
        }
        this.args = new_map;
    }

    public void insertArgument(Argument arg) {
        this.args.put(arg.getName(), (Argument) arg.setParent(this));
    }

    public List<Argument> getArgumentList() {
        return new ArrayList<>(this.args.values());
    }

    public TypeElement getReturn() {
        return this.rc;
    }

    public void setReturn(TypeElement rc) {
        ASTElement associated = rc.setParent(this);
        this.rc = (TypeElement) associated;
    }

    public void setBody(CompoundStatement body) {
        ASTElement associated = body.setParent(this);
        this.body = Optional.of((CompoundStatement) associated);
    }

    public void setName(String name) {
        if (this.parent != null) {
            throw new RuntimeException("setting the name on an owned Function is a terrible idea");
        }
        this.name = name;
    }

    public Optional<ASTElement> getChild(String name) {
        if (this.args.containsKey(name)) {
            return Optional.of(this.args.get(name));
        } else {
            return Optional.empty();
        }
    }

    public void transform(ASTTransformer t) {
        rc.transform(t);
        rc = t.transform(rc);

        for (Entry<String, Argument> arg : args.entrySet()) {
            arg.getValue().transform(t);
            args.replace(arg.getKey(), (Argument) t.transform(arg.getValue()).setParent(this));
        }

        if (this.body.isPresent()) {
            this.body.get().transform(t);
            this.setBody(t.transform(this.body.get()));
        }
    }

    @Override
    public FunctionType getOwnType() {
        return (FunctionType) new FunctionType(span, this.getPath()).setParent(this);
    }

    public boolean isStatic() {
        return is_static;
    }

    public LLVMFunction generate(LLVMModule module) {
        LLVMFunctionType type = (LLVMFunctionType) this.getOwnType().resolve().generate(module);
        LLVMFunction rc = module.getOrInsertFunction(type, this.getPath(), (f) -> {
            if (this.body.isPresent()) {
                f.appendBasicBlock("entry");
                this.body.get().generate(f);
            }
        });
        return rc;
    }
}
