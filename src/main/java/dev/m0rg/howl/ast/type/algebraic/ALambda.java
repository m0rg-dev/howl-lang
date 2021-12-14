package dev.m0rg.howl.ast.type.algebraic;

public class ALambda extends ALambdaTerm {
    String boundVariable;
    AlgebraicType definition;

    public ALambda(String boundVariable, AlgebraicType definition) {
        this.boundVariable = boundVariable;
        this.definition = definition;
    }

    @Override
    public String format() {
        return "(λ" + boundVariable + " . " + definition.format() + ")";
    }
}
