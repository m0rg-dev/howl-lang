use super::{ASTElement, ASTElementKind, ASTHandle};

pub fn pretty_print(source: ASTHandle) -> String {
    let parts: Vec<String> = source
        .as_ref()
        .slots()
        .iter()
        .map(|x| pretty_print(source.as_ref().slot(x).unwrap()))
        .collect();

    match &source.as_ref().element {
        ASTElementKind::Module { name: _ } => {
            let header = format!("/* module: {} */\n\n", source.as_ref().path());

            header + &parts.join("\n\n")
        }

        ASTElementKind::Class { span: _, name } => {
            format!(
                "/* path: {} */\nclass {} {{\n{}\n}}",
                source.as_ref().path(),
                name,
                textwrap::indent(&parts.join("\n"), "    ")
            )
        }

        ASTElementKind::ClassField {
            span: _,
            name,
            type_ref,
        } => {
            format!("{} {};", pretty_print(type_ref.clone()), name)
        }

        ASTElementKind::UnresolvedIdentifier { span: _, name } => {
            format!("/* unresolved */ {}", name)
        }

        ASTElementKind::Placeholder() => "/* placeholder */".to_owned(),
    }
}

impl std::fmt::Debug for ASTElement {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let mut builder = f.debug_struct("ASTElement");
        if self.parent.is_some() {
            builder.field("parent", &self.parent.as_ref().unwrap().get_id());
        }

        match &self.element {
            ASTElementKind::Module { .. } => {
                builder.field("type", &"Module");
                builder.field("path", &self.path());
            }
            ASTElementKind::Class { .. } => {
                builder.field("type", &"Class");
                builder.field("path", &self.path());
            }
            ASTElementKind::ClassField { .. } => {
                builder.field("type", &"ClassField");
                builder.field("path", &self.path());
            }
            ASTElementKind::UnresolvedIdentifier { span: _, name } => {
                builder.field("type", &"Identifier");
                builder.field("name", &name);
            }
            ASTElementKind::Placeholder() => {
                builder.field("type", &"Placeholder");
            }
        }

        builder.field("slots", &self.slots.borrow()).finish()
    }
}
