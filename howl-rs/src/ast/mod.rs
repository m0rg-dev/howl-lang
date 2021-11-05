use std::cell::RefCell;
use std::collections::HashMap;
use std::ops::Deref;
use std::rc::Rc;

pub mod pretty_print;

pub const CLASS_EXTENDS: &str = "__extends";
pub const CLASS_FIELD_TYPE: &str = "__type";
pub const FUNCTION_RETURN: &str = "__return";
pub const RAW_POINTER_TYPE_INNER: &str = "__inner";
pub const SPECIFIED_TYPE_BASE: &str = "__base";
pub const TYPE_DEFINITION: &str = "__definition";

#[derive(Clone)]
pub struct ASTElement {
    inner: Rc<ASTElementCommon>,
}

impl ASTElement {
    pub fn new(element: ASTElementKind) -> ASTElement {
        ASTElement {
            inner: Rc::new(ASTElementCommon {
                parent: None,
                element,
                slots: RefCell::new(HashMap::new()),
                var_slot_idx: RefCell::new(0),
            }),
        }
    }

    pub fn with_parent(self, parent: ASTElement) -> ASTElement {
        ASTElement {
            inner: Rc::new(ASTElementCommon {
                parent: Some(parent.clone()),
                element: self.inner.element.clone(),
                slots: self.inner.slots.clone(),
                var_slot_idx: self.inner.var_slot_idx.clone(),
            }),
        }
    }

    pub fn element(&self) -> ASTElementKind {
        self.inner.element.clone()
    }

    pub fn slot_insert(&self, name: &str, contents: ASTElement) -> ASTElement {
        let to_insert = contents.with_parent(self.clone());
        self.inner
            .slots
            .borrow_mut()
            .insert(name.to_string(), to_insert.clone());
        to_insert
    }

    pub fn slot_push(&self, contents: ASTElement) {
        let new_idx = {
            let mut idx_ref = self.inner.var_slot_idx.borrow_mut();
            let new_idx = *idx_ref;
            *idx_ref += 1;
            new_idx
        };
        self.slot_insert(&new_idx.to_string(), contents);
    }

    pub fn slot_vec(&self) -> Vec<ASTElement> {
        (0..*self.inner.var_slot_idx.borrow())
            .map(|x| self.slot(&x.to_string()).unwrap())
            .collect()
    }

    pub fn slot(&self, slot: &str) -> Option<ASTElement> {
        self.inner.slots.borrow().get(slot).map(|x| x.to_owned())
    }

    pub fn slots(&self) -> Vec<(String, ASTElement)> {
        self.inner
            .slots
            .borrow()
            .iter()
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
        #[allow(unreachable_patterns)]
        match &self.inner.element {
            // TODO DRY
            ASTElementKind::Module { name } => {
                if self.inner.parent.is_some() {
                    self.inner.parent.as_ref().unwrap().path() + "." + name
                } else {
                    name.clone()
                }
            }
            ASTElementKind::Function { name, .. } => {
                if self.inner.parent.is_some() {
                    self.inner.parent.as_ref().unwrap().path() + "." + name
                } else {
                    name.clone()
                }
            }
            ASTElementKind::NewType { name, .. } => {
                if self.inner.parent.is_some() {
                    self.inner.parent.as_ref().unwrap().path() + "." + name
                } else {
                    name.clone()
                }
            }
            ASTElementKind::Class { span: _, name, .. } => {
                if self.inner.parent.is_some() {
                    self.inner.parent.as_ref().unwrap().path() + "." + name
                } else {
                    name.clone()
                }
            }
            ASTElementKind::ClassField { span: _, name, .. } => {
                if self.inner.parent.is_some() {
                    self.inner.parent.as_ref().unwrap().path() + "." + name
                } else {
                    name.clone()
                }
            }
            _ => unimplemented!(),
        }
    }
}

#[derive(Clone)]
pub struct ASTElementCommon {
    pub parent: Option<ASTElement>,
    pub element: ASTElementKind,
    slots: RefCell<HashMap<String, ASTElement>>,
    var_slot_idx: RefCell<usize>,
}

#[derive(Clone)]
pub enum ASTElementKind {
    Module {
        name: String,
    },
    Class {
        span: lrpar::Span,
        name: String,
    },
    ClassField {
        span: lrpar::Span,
        name: String,
    },
    Function {
        span: lrpar::Span,
        is_static: bool,
        name: String,
    },
    NewType {
        name: String,
    },
    RawPointerType {
        span: lrpar::Span,
    },
    SpecifiedType {
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
