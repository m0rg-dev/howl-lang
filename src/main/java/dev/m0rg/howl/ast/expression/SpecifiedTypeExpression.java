package dev.m0rg.howl.ast.expression;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AStructureReference;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMConstant;
import dev.m0rg.howl.llvm.LLVMGlobalVariable;
import dev.m0rg.howl.llvm.LLVMIntType;
import dev.m0rg.howl.llvm.LLVMPointerType;
import dev.m0rg.howl.llvm.LLVMStructureType;
import dev.m0rg.howl.llvm.LLVMType;
import dev.m0rg.howl.llvm.LLVMValue;

public class SpecifiedTypeExpression extends Expression {
    Expression source;
    List<TypeElement> parameters;

    public SpecifiedTypeExpression(Span span) {
        super(span);
        parameters = new ArrayList<>();
    }

    @Override
    public ASTElement detach() {
        SpecifiedTypeExpression rc = new SpecifiedTypeExpression(span);
        rc.setSource((Expression) source.detach());
        for (TypeElement p : parameters) {
            rc.insertParameter((TypeElement) p.detach());
        }
        return rc;
    }

    @Override
    public String format() {
        List<String> pstrs = new ArrayList<>(this.parameters.size());
        for (TypeElement p : this.parameters) {
            pstrs.add(p.format());
        }
        return this.source.format() + "<" + String.join(", ", pstrs) + ">";
    }

    public Expression getSource() {
        return source;
    }

    public void setSource(Expression source) {
        this.source = (Expression) source.setParent(this);
    }

    public List<TypeElement> getParameters() {
        return Collections.unmodifiableList(parameters);
    }

    public TypeElement getParameter(int index) {
        return parameters.get(index);
    }

    public void insertParameter(TypeElement parameter) {
        parameters.add((TypeElement) parameter.setParent(this));
    }

    public void transform(ASTTransformer t) {
        source.transform(t);
        setSource(t.transform(source));
        for (int i = 0; i < parameters.size(); i++) {
            parameters.get(i).transform(t);
            parameters.set(i, t.transform(parameters.get(i)));
        }
    }

    public LLVMValue generate(LLVMBuilder builder) {
        // TODO dedupe with NameExpression
        AStructureReference t = (AStructureReference) ALambdaTerm.evaluateFrom(this);
        LLVMType static_type = t.generateStaticType(builder.getModule());
        LLVMType object_type = t.generateObjectType(builder.getModule());
        LLVMGlobalVariable g = builder.getModule().getOrInsertGlobal(static_type, t.getPathMangled() + "_static");
        LLVMStructureType rctype = t.toLLVM(builder.getModule());
        LLVMConstant anon_struct = rctype.createConstant(builder.getContext(), Arrays.asList(new LLVMConstant[] {
                new LLVMPointerType<>(object_type).getNull(builder.getModule()),
                g,
                new LLVMPointerType<>(new LLVMIntType(builder.getContext(), 8)).getNull(builder.getModule()),
        }));
        return anon_struct;
    }

    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        return rc;
    }
}
