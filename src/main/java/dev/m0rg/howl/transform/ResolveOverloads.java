package dev.m0rg.howl.transform;

import java.util.ArrayList;
import java.util.List;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.expression.FieldReferenceExpression;
import dev.m0rg.howl.ast.expression.FunctionCallExpression;
import dev.m0rg.howl.ast.type.ClassStaticType;
import dev.m0rg.howl.ast.type.FunctionType;
import dev.m0rg.howl.ast.type.InterfaceStaticType;
import dev.m0rg.howl.ast.type.StructureType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.logger.Logger;

public class ResolveOverloads implements ASTTransformer {
    public ASTElement transform(ASTElement e) {
        if (e instanceof FunctionCallExpression && !((FunctionCallExpression) e).isResolved()) {
            FunctionCallExpression as_call = (FunctionCallExpression) e;
            Expression source = as_call.getSource();
            if (source instanceof FieldReferenceExpression) {
                FieldReferenceExpression frex = (FieldReferenceExpression) source;
                TypeElement source_type = frex.getSource().getResolvedType();
                if (source_type instanceof StructureType) {
                    Logger.trace("ResolveOverloads " + frex.getSource().format() + " -> " + frex.getName());
                    Logger.trace("  source type " + source_type.format());
                    List<String> argument_types = new ArrayList<>();
                    for (Expression arg : as_call.getArguments()) {
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
                        List<TypeElement> argtypes = candidate.getOwnType().getArgumentTypes();
                        if (argtypes.size() == as_call.getArguments().size()) {
                            for (int i = 0; i < argtypes.size(); i++) {
                                TypeElement argtype = argtypes.get(i).resolve();
                                TypeElement sourcearg = as_call.getArguments().get(i).getResolvedType();
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
                        List<String> description = new ArrayList<>(candidates.size() + 1);
                        description.add("Argument types: " + String.join(", ", argument_types));
                        for (Function candidate : candidates) {
                            FunctionType t = candidate.getOwnType();
                            StringBuilder this_line = new StringBuilder();
                            this_line.append("candidate: ");
                            this_line.append(candidate.getOriginalName());
                            this_line.append("(");

                            List<TypeElement> argtypes = t.getArgumentTypes();
                            List<String> args_formatted = new ArrayList<>();

                            for (int i = 0; i < argtypes.size(); i++) {
                                TypeElement argtype = argtypes.get(i);
                                if (i < as_call.getArguments().size()) {
                                    TypeElement sourcearg = as_call.getArguments().get(i).getResolvedType();
                                    if (argtype.resolve().accepts(sourcearg)) {
                                        args_formatted.add("\u001b[32m" + argtype.format() + "\u001b[0m");
                                    } else {
                                        args_formatted.add("\u001b[31m" + argtype.format() + "\u001b[0m");
                                    }
                                } else {
                                    args_formatted.add("\u001b[33m" + argtype.format() + "\u001b[0m");
                                }
                            }

                            if (argtypes.size() < as_call.getArguments().size()) {
                                for (int i = argtypes.size(); i < as_call.getArguments().size(); i++) {
                                    args_formatted
                                            .add("\u001b[35m" + as_call.getArguments().get(i).format() + "\u001b[0m");
                                }
                            }

                            this_line.append(String.join(", ", args_formatted));
                            this_line.append(")");
                            description.add(this_line.toString());
                        }
                        e.getSpan().addError("No valid overload found", String.join("\n", description));
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
