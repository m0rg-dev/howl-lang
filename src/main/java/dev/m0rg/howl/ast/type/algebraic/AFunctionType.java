package dev.m0rg.howl.ast.type.algebraic;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import dev.m0rg.howl.ast.Argument;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.type.LambdaType;
import dev.m0rg.howl.ast.type.TypeElement;

public class AFunctionType extends AlgebraicType {
    AlgebraicType returntype;
    List<AlgebraicType> arguments;

    public AFunctionType(Function source, Map<String, AlgebraicType> typemap) {
        returntype = AlgebraicType.derive(source.getReturn(), typemap);
        arguments = new ArrayList<>();
        for (Argument a : source.getArgumentList()) {
            arguments.add(AlgebraicType.derive(a.getOwnType(), typemap));
        }
    }

    public AFunctionType(AlgebraicType returntype, List<AlgebraicType> arguments) {
        this.returntype = returntype;
        this.arguments = new ArrayList<>(arguments);
    }

    public AFunctionType(LambdaType source, Map<String, AlgebraicType> typemap) {
        returntype = AlgebraicType.derive(source.getReturnType(), typemap);
        arguments = new ArrayList<>();
        for (TypeElement a : source.getArgumentTypes()) {
            arguments.add(AlgebraicType.derive(a, typemap));
        }
    }

    AFunctionType(AFunctionType other, Map<String, AlgebraicType> evalmap) {
        returntype = other.returntype.evaluate(evalmap);
        arguments = new ArrayList<>();
        for (AlgebraicType a : other.arguments) {
            arguments.add(a.evaluate(evalmap));
        }
    }

    public String format() {
        List<String> afmt = new ArrayList<>();
        for (AlgebraicType a : arguments) {
            afmt.add(a.format());
        }

        return "fn " + returntype.format() + "(" + String.join(", ", afmt) + ")";
    }

    public AlgebraicType getArgument(int index) {
        return arguments.get(index);
    }

    public AlgebraicType evaluate(Map<String, AlgebraicType> evalmap) {
        return new AFunctionType(this, evalmap);
    }

    public TypeElement toElement() {
        LambdaType rc = new LambdaType(null);
        rc.setReturn((TypeElement) returntype.toElement().detach());
        for (AlgebraicType a : arguments) {
            rc.insertArgument((TypeElement) a.toElement().detach());
        }
        return rc;
    }
}