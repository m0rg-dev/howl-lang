package dev.m0rg.howl.transform;

import java.util.Map;
import java.util.Map.Entry;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.HasUpstreamFields;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.ast.type.NewType;
import dev.m0rg.howl.ast.type.ObjectSnapshotType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.logger.Logger;

public class InferTypes implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof HasUpstreamFields) {
            Logger.trace("InferTypes: " + e.format());
            for (Entry<String, FieldHandle> ent : ((HasUpstreamFields) e).getUpstreamFields().entrySet()) {
                TypeElement expected = ent.getValue().getExpectedType().resolve();
                TypeElement provided = ent.getValue().getSubexpression().getResolvedType();
                Logger.trace(
                        "  " + ent.getKey() + " " + expected.format() + " <- "
                                + provided.format());
                if (expected instanceof NewType) {
                    NewType nt_expected = (NewType) expected;
                    if (provided instanceof NewType) {
                        NewType nt_provided = (NewType) expected;
                        if (nt_expected.getPath().equals(nt_provided.getPath())) {
                            return e;
                        }
                    } else if (provided instanceof NamedType && ((NamedType) provided).getName().equals("__error")) {
                        return e;
                    }
                    Logger.trace("setting: " + provided.format());
                    nt_expected.setResolution(provided);
                } else if (expected instanceof ObjectSnapshotType) {
                    ObjectSnapshotType ost_expected = (ObjectSnapshotType) expected;
                    if (provided instanceof ObjectSnapshotType) {
                        ObjectSnapshotType ost_provided = (ObjectSnapshotType) provided;
                        Map<String, NewType> provided_parameters = ost_provided.getGenericTypes();
                        for (Entry<String, NewType> expected_parameter : ost_expected.getGenericTypes().entrySet()) {
                            TypeElement expected_resolved = expected_parameter.getValue().resolve();
                            TypeElement provided_resolved = provided_parameters.get(expected_parameter.getKey())
                                    .resolve();
                            Logger.trace("  " + expected_parameter.getKey() + " "
                                    + expected_resolved.format() + " <- "
                                    + provided_resolved.format());
                            if (expected_resolved instanceof NewType) {
                                NewType nt_expected_resolved = (NewType) expected_resolved;
                                if (!nt_expected_resolved.isResolved()
                                        || nt_expected_resolved.getResolution().get().accepts(provided_resolved)) {
                                    Logger.trace("asdf " + nt_expected_resolved.getRealSource().format());
                                    Logger.trace("setting: " + provided_resolved.format());
                                    nt_expected_resolved.setResolution((TypeElement) provided_resolved.detach());
                                }
                            }
                        }
                    }
                }
            }
            return e;
        } else {
            return e;
        }
    }
}
