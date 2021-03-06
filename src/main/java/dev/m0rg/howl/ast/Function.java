package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map.Entry;
import java.util.Optional;

import dev.m0rg.howl.ast.statement.CompoundStatement;
import dev.m0rg.howl.ast.type.FunctionType;
import dev.m0rg.howl.ast.type.HasOwnType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.llvm.LLVMFunction;
import dev.m0rg.howl.llvm.LLVMFunctionType;
import dev.m0rg.howl.llvm.LLVMModule;
import dev.m0rg.howl.llvm.LLVMType;
import dev.m0rg.howl.logger.Logger;

public class Function extends ASTElement implements NamedElement, NameHolder, HasOwnType {
    boolean is_static;
    boolean is_extern;
    String name;
    String original_name;
    TypeElement rc;
    LinkedHashMap<String, Argument> args;
    Optional<CompoundStatement> body;
    List<TypeElement> throws_list;

    public Function(Span span, boolean is_static, boolean is_extern, String name) {
        super(span);
        this.is_static = is_static;

        this.is_extern = is_extern;
        if (is_extern) {
            this.is_static = true;
        }

        this.name = this.original_name = name;
        this.args = new LinkedHashMap<String, Argument>();
        this.body = Optional.empty();
        this.throws_list = new ArrayList<TypeElement>();
    }

    @Override
    public ASTElement detach() {
        Function rc = new Function(span, is_static, is_extern, name);
        rc.setReturn((TypeElement) this.rc.detach());
        for (Entry<String, Argument> field : args.entrySet()) {
            rc.insertArgument((Argument) field.getValue().detach());
        }
        if (this.body.isPresent()) {
            rc.setBody((CompoundStatement) this.body.get().detach());
        }
        for (TypeElement th : this.throws_list) {
            rc.insertThrow((TypeElement) th.detach());
        }
        rc.original_name = original_name;
        return rc;
    }

    @Override
    public String format() {
        StringBuilder rc = new StringBuilder();
        if (this.is_extern) {
            rc.append("extern ");
        } else if (this.is_static) {
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

    public void insertThrow(TypeElement exc) {
        this.throws_list.add((TypeElement) exc.setParent(this));
    }

    public List<TypeElement> getThrows() {
        return Collections.unmodifiableList(throws_list);
    }

    public Optional<CompoundStatement> getBody() {
        return body;
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

    // ONLY to be used if you know you're who called setParent
    public void setNameUnchecked(String name) {
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
        try {
            rc.transform(t);
            setReturn(t.transform(rc));

            for (Entry<String, Argument> arg : args.entrySet()) {
                arg.getValue().transform(t);
                args.replace(arg.getKey(), (Argument) t.transform(arg.getValue()).setParent(this));
            }

            if (this.body.isPresent()) {
                this.body.get().transform(t);
                this.setBody(t.transform(this.body.get()));
            }
        } catch (Exception e) {
            Logger.error("Exception in transform: " + this.getPath());
            throw e;
        }
    }

    @Override
    public FunctionType getOwnType() {
        return (FunctionType) new FunctionType(span, this.getPath()).setParent(this);
    }

    public boolean isStatic() {
        return is_static;
    }

    public boolean isExtern() {
        return is_extern;
    }

    public String getLLVMPath() {
        if (this.is_extern) {
            return original_name;
        } else {
            return getPath();
        }
    }

    public LLVMFunction generate(LLVMModule module) {
        LLVMFunctionType type = this.generateType(module);
        if (this.is_extern) {
            // TODO check for duplicate extern functions
            return module.getOrInsertFunction(type, this.getOriginalName(), f -> f.setExternal(), true);
        } else {
            return module.getOrInsertFunction(type, this.getPath(), (f) -> {
                if (this.body.isPresent()) {
                    f.appendBasicBlock("entry");
                    this.body.get().generate(f);
                }
            }, false);
        }
    }

    public LLVMFunctionType generateType(LLVMModule module) {
        LLVMType returntype = ALambdaTerm.evaluateFrom(this.getReturn()).toLLVM(module);
        List<LLVMType> args = new ArrayList<>(this.getArgumentList().size());
        for (TypeElement argtype : this.getArgumentList().stream().map(x -> x.getOwnType()).toList()) {
            args.add(ALambdaTerm.evaluateFrom(argtype).toLLVM(module));
        }
        return new LLVMFunctionType(returntype, args);
    }
}
