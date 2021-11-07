use std::cell::RefCell;
use std::collections::HashMap;
use std::ops::Deref;
use std::rc::Rc;

pub mod pretty_print;

pub const ASSIGNMENT_STATEMENT_LHS: &str = "__lhs";
pub const ASSIGNMENT_STATEMENT_RHS: &str = "__rhs";
pub const CLASS_EXTENDS: &str = "__extends";
pub const CLASS_FIELD_TYPE: &str = "__type";
pub const FUNCTION_BODY: &str = "__body";
pub const FUNCTION_RETURN: &str = "__return";
pub const LOCAL_DEFINITION_STATEMENT_INITIALIZER: &str = "__initializer";
pub const LOCAL_DEFINITION_STATEMENT_TYPE: &str = "__type";
pub const RAW_POINTER_TYPE_INNER: &str = "__inner";
pub const SIMPLE_STATEMENT_EXPRESSION: &str = "__expression";
pub const RETURN_STATEMENT_EXPRESSION: &str = "__expression";
pub const SPECIFIED_TYPE_BASE: &str = "__base";
pub const THROW_STATEMENT_EXPRESSION: &str = "__expression";
pub const TYPE_DEFINITION: &str = "__definition";

pub struct ASTElement {
    inner: Rc<RefCell<ASTElementCommon>>,
}

impl Clone for ASTElement {
    fn clone(&self) -> Self {
        Self {
            inner: Rc::clone(&self.inner),
        }
    }
}

impl ASTElement {
    pub fn new(element: ASTElementKind) -> ASTElement {
        ASTElement {
            inner: Rc::new(RefCell::new(ASTElementCommon {
                parent: None,
                element,
                slots: RefCell::new(HashMap::new()),
            })),
        }
    }

    pub fn set_parent(self, parent: &ASTElement) -> ASTElement {
        {
            let new_inner = ASTElementCommon {
                parent: Some(parent.clone()),
                element: self.inner.borrow().element.clone(),
                slots: self.inner.borrow().slots.clone(),
            };
            let mut inner_ref = self.inner.borrow_mut();
            *inner_ref = new_inner;
        }
        self
    }

    pub fn element(&self) -> ASTElementKind {
        self.inner.borrow().element.clone()
    }

    pub fn slot_insert(&self, name: &str, contents: ASTElement) -> ASTElement {
        let new_element = contents.set_parent(self);
        self.inner
            .borrow()
            .slots
            .borrow_mut()
            .insert(name.to_string(), new_element.clone());
        new_element
    }

    pub fn var_slot_idx(&self) -> usize {
        self.inner
            .borrow()
            .slots
            .borrow()
            .iter()
            .filter(|(name, _)| name.parse::<u64>().is_ok())
            .collect::<Vec<(&String, &ASTElement)>>()
            .len()
    }

    pub fn slot_push(&self, contents: ASTElement) -> ASTElement {
        self.slot_insert(&self.var_slot_idx().to_string(), contents)
    }

    pub fn slot_vec(&self) -> Vec<ASTElement> {
        (0..self.var_slot_idx())
            .map(|x| self.slot(&x.to_string()).unwrap())
            .collect()
    }

    pub fn slot(&self, slot: &str) -> Option<ASTElement> {
        self.inner
            .borrow()
            .slots
            .borrow()
            .get(slot)
            .map(|x| x.to_owned())
    }

    pub fn slots(&self) -> Vec<(String, ASTElement)> {
        self.inner
            .borrow()
            .slots
            .borrow()
            .iter()
            .map(|(name, el)| (name.clone(), el.clone()))
            .collect()
    }

    pub fn slots_normal(&self) -> Vec<(String, ASTElement)> {
        self.inner
            .borrow()
            .slots
            .borrow()
            .iter()
            .filter(|(name, _)| !name.parse::<u64>().is_ok())
            .filter(|(name, _)| !name.starts_with("__"))
            .map(|(name, el)| (name.clone(), el.clone()))
            .collect()
    }

    pub fn slot_copy(&mut self, source: &ASTElement) {
        source.slots().into_iter().for_each(|(name, el)| {
            self.slot_insert(&name, el);
        });
    }

    pub fn transform<T>(&self, path: String, callback: &T) -> ASTElement
    where
        T: Fn(String, ASTElement) -> ASTElement,
    {
        let new_element = ASTElement::new(self.element());

        self.slots().into_iter().for_each(|(name, element)| {
            let mut element = callback(path.clone() + "." + &name, element);
            element = element.transform(path.clone() + "." + &name, callback);
            new_element.slot_insert(&name, element);
        });

        new_element
    }

    pub fn path(&self) -> String {
        let parent = match &self.inner.borrow().parent {
            Some(el) => el.path() + ".",
            None => "".to_string(),
        };

        let temp = self.inner.borrow();

        let own = match &temp.element {
            ASTElementKind::Module { name } => name,
            ASTElementKind::Class { name, .. } => name,
            ASTElementKind::ClassField { name, .. } => name,
            ASTElementKind::Function { name, .. } => name,
            ASTElementKind::NewType { name, .. } => name,
            _ => "__anonymous",
        };

        parent + &own
    }
}

pub struct ASTElementCommon {
    pub parent: Option<ASTElement>,
    pub element: ASTElementKind,
    slots: RefCell<HashMap<String, ASTElement>>,
}

#[derive(Clone)]
pub enum ASTElementKind {
    AssignmentStatement {
        span: lrpar::Span,
    },
    Class {
        span: lrpar::Span,
        name: String,
    },
    ClassField {
        span: lrpar::Span,
        name: String,
    },
    CompoundStatement {
        span: lrpar::Span,
    },
    Function {
        span: lrpar::Span,
        is_static: bool,
        name: String,
    },
    LocalDefinitionStatement {
        span: lrpar::Span,
        name: String,
    },
    Module {
        name: String,
    },
    NewType {
        name: String,
    },
    RawPointerType {
        span: lrpar::Span,
    },
    ReturnStatement {
        span: lrpar::Span,
    },
    SpecifiedType {
        span: lrpar::Span,
    },
    SimpleStatement {
        span: lrpar::Span,
    },
    ThrowStatement {
        span: lrpar::Span,
    },
    UnresolvedIdentifier {
        span: lrpar::Span,
        name: String,
        namespace: String,
    },
    Placeholder(),
}

impl Deref for ASTElementCommon {
    type Target = ASTElementKind;

    fn deref(&self) -> &Self::Target {
        &self.element
    }
}
