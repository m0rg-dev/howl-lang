package dev.m0rg.howl.ast.type.algebraic;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import dev.m0rg.howl.logger.Logger;

public class ASpecify extends AlgebraicType {
    AlgebraicType source;
    Map<String, AlgebraicType> parameters;

    public ASpecify(AlgebraicType source, Map<String, AlgebraicType> parameters) {
        this.source = source;
        this.parameters = parameters;
    }

    public String format() {
        List<String> pstr = new ArrayList<>(parameters.size());
        for (Entry<String, AlgebraicType> e : parameters.entrySet()) {
            pstr.add(e.getKey() + " => " + e.getValue());
        }

        return this.source.format() + " . (" + String.join("\n", pstr) + ")";
    }

    public AlgebraicType getSource() {
        return source;
    }

    public Map<String, AlgebraicType> getParameters() {
        return Collections.unmodifiableMap(parameters);
    }

    public AlgebraicType evaluate(Map<String, AlgebraicType> evalmap) {
        Map<String, AlgebraicType> new_typemap = new HashMap<>(evalmap);

        for (int i = 0; i < parameters.size(); i++) {
            if (source instanceof AStructureType) {
                AStructureType st = (AStructureType) source;
                if (st.parameters.get(i) instanceof AFreeType) {
                    new_typemap.put(((AFreeType) st.parameters.get(i)).owner.getPath(), parameters.get(i));
                }
            }
        }

        for (Entry<String, AlgebraicType> e : new_typemap.entrySet()) {
            Logger.trace("  " + e.getKey() + " => " + e.getValue().format());
        }

        AlgebraicType rc = source.evaluate(new_typemap);
        Logger.trace("aspecify " + rc.format());
        return rc;
    }
}
