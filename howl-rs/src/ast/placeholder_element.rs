use super::{CSTMismatchError, Element};
use crate::parser::CSTElement;

#[derive(Debug)]
pub struct PlaceholderElement {
    span: lrpar::Span,
}

impl PlaceholderElement {
    pub fn from_cst(_: CSTElement) -> Result<PlaceholderElement, CSTMismatchError> {
        Ok(PlaceholderElement {
            span: lrpar::Span::new(0, 0),
        })
    }
}

impl Element for PlaceholderElement {
    fn span(&self) -> lrpar::Span {
        self.span
    }
}
impl std::fmt::Display for PlaceholderElement {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "/* placeholder */")
    }
}
