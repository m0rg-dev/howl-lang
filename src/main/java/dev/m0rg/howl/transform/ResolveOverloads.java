package dev.m0rg.howl.transform;

import java.util.ArrayList;
import java.util.List;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.ClassStaticType;
import dev.m0rg.howl.ast.Expression;
import dev.m0rg.howl.ast.FieldReferenceExpression;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.FunctionCallExpression;
import dev.m0rg.howl.ast.FunctionType;
import dev.m0rg.howl.ast.InterfaceStaticType;
import dev.m0rg.howl.ast.StructureType;
import dev.m0rg.howl.ast.TypeElement;
import dev.m0rg.howl.logger.Logger;

public class ResolveOverloads implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof FunctionCallExpression && !((FunctionCallExpression) e).isResolved()) {
            Expression source = ((FunctionCallExpression) e).getSource();
            if (source instanceof FieldReferenceExpression) {
                FieldReferenceExpression frex = (FieldReferenceExpression) source;
                TypeElement source_type = frex.getSource().getResolvedType();
                if (source_type instanceof StructureType) {
                    Logger.trace("ResolveOverloads " + frex.getSource().format() + " -> " + frex.getName());
                    Logger.trace("  source type " + source_type.format());
                    List<String> argument_types = new ArrayList<>();
                    for (Expression arg : ((FunctionCallExpression) e).getArguments()) {
                        argument_types.add(arg.getResolvedType().format());
                    }
                    Logger.trace("  argument types " + String.join(", ", argument_types));
                    List<Function> candidates;
                    if (source_type instanceof ClassStaticType) {
                        candidates = ((ClassStaticType) source_type).getSource()
                                .getOverloadCandidates(frex.getName());
                    } else if (source_type instanceof InterfaceStaticType) {
                        candidates = ((InterfaceStaticType) source_type).getSource()
                                .getOverloadCandidates(frex.getName());
                    } else {
                        // TODO: error case?
                        candidates = new ArrayList<>();
                    }
                    List<Function> matches = new ArrayList<>();
                    for (Function candidate : candidates) {
                        List<String> candidate_types = new ArrayList<>();
                        boolean all_match = true;
                        if ((((FunctionType) candidate.getOwnType()).getArgumentTypes())
                                .size() == ((FunctionCallExpression) e).getArguments().size()) {
                            for (int i = 0; i < (((FunctionType) candidate.getOwnType()).getArgumentTypes())
                                    .size(); i++) {
                                TypeElement argtype = (((FunctionType) candidate.getOwnType()).getArgumentTypes())
                                        .get(i)
                                        .resolve();
                                TypeElement sourcearg = ((FunctionCallExpression) e).getArguments().get(i)
                                        .getResolvedType();
                                if (argtype.accepts(sourcearg)) {
                                    candidate_types.add(argtype.format() + " \u001b[32m✔︎\u001b[0m");
                                } else {
                                    candidate_types.add(argtype.format() + " \u001b[31m✘\u001b[0m");
                                    all_match = false;
                                }
                            }
                        } else {
                            all_match = false;
                        }
                        Logger.trace("  candidate " + candidate.getOwnType().format() + " : "
                                + String.join(", ", candidate_types));
                        if (all_match) {
                            matches.add(candidate);
                        }
                    }
                    if (matches.size() > 1) {
                        Logger.trace("  ambiguous.");
                    } else if (matches.size() == 0) {
                        Logger.trace("  invalid.");
                    } else {
                        Logger.trace("  resolved to " + matches.get(0).getName() + ".");

                        FunctionCallExpression new_tree = (FunctionCallExpression) e.detach();
                        FieldReferenceExpression new_frex = (FieldReferenceExpression) frex.detach();
                        new_frex.setName(matches.get(0).getName());
                        new_tree.setSource(new_frex);
                        new_tree.resolve();
                        return new_tree;
                    }
                }
            }
            return e;
        } else {
            return e;
        }
    }
}
