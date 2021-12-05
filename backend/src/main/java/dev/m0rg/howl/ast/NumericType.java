package dev.m0rg.howl.ast;

import java.util.Optional;

public class NumericType extends NamedType {
    int width;
    boolean signed;
    boolean is_literal;

    NumericType(Span span, String name, int width, boolean signed, boolean is_literal) {
        super(span, name);
        this.width = width;
        this.signed = signed;
        this.is_literal = is_literal;
    }

    public static NumericType build(Span span, int width, boolean signed) {
        StringBuilder name = new StringBuilder();
        if (signed) {
            name.append("i");
        } else {
            name.append("u");
        }
        name.append(width);
        return new NumericType(span, name.toString(), width, signed, false);
    }

    static Optional<NumericType> try_from(NamedType t) {
        if (t.name.matches("^[iu][0-9]+")) {
            boolean signed;
            if (t.name.startsWith("u")) {
                signed = false;
            } else {
                signed = true;
            }
            int width = Integer.parseInt(t.name.substring(1));
            NumericType rc = new NumericType(t.span, t.name, width, signed, false);
            rc.setParent(t.getParent());
            return Optional.of(rc);
        } else if (t.name.equals("__numeric")) {
            NumericType rc = new NumericType(t.span, t.name, 64, true, true);
            return Optional.of(rc);
        } else {
            return Optional.empty();
        }
    }

    @Override
    public String format() {
        return "'" + this.name + " \u001b[34m/* numeric */\u001b[0m";
    }

    @Override
    public ASTElement detach() {
        return new NumericType(span, name, width, signed, is_literal);
    }

    public boolean isLiteral() {
        return is_literal;
    }

    public boolean isSigned() {
        return signed;
    }

    public int getWidth() {
        return width;
    }
}
