use std::cell::RefCell;
use std::collections::HashMap;
use std::ops::Deref;

use self::arena::{ASTArena, ASTHandle};

pub mod arena;
pub mod pretty_print;

pub const CLASS_EXTENDS: &str = "__extends";
pub const CLASS_FIELD_TYPE: &str = "__type";
pub const FUNCTION_RETURN: &str = "__return";
pub const RAW_POINTER_TYPE_INNER: &str = "__inner";
pub const SPECIFIED_TYPE_BASE: &str = "__base";
pub const TYPE_DEFINITION: &str = "__definition";

#[derive(Clone)]
pub struct ASTElement {
    pub parent: Option<ASTHandle>,
    pub element: ASTElementKind,
    slots: RefCell<HashMap<String, ASTHandle>>,
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

impl ASTElement {
    pub fn new(element: ASTElementKind) -> ASTElement {
        ASTElement {
            parent: None,
            element,
            slots: RefCell::new(HashMap::new()),
            var_slot_idx: RefCell::new(0),
        }
    }

    pub fn with_parent(self, parent: &ASTHandle) -> ASTElement {
        ASTElement {
            parent: Some(parent.clone()),
            element: self.element,
            slots: self.slots,
            var_slot_idx: self.var_slot_idx,
        }
    }

    pub fn slot_insert(
        arena: &ASTArena,
        target: &ASTHandle,
        slot: &str,
        contents: ASTElement,
    ) -> ASTHandle {
        let new_handle = arena.insert(contents.with_parent(target));
        let target = target.borrow();
        target
            .slots
            .borrow_mut()
            .insert(slot.to_owned(), new_handle.clone());
        new_handle
    }

    pub fn path(&self) -> String {
        #[allow(unreachable_patterns)]
        match &self.element {
            // TODO DRY
            ASTElementKind::Module { name } => {
                if self.parent.is_some() {
                    self.parent.as_ref().unwrap().borrow().path() + "." + name
                } else {
                    name.clone()
                }
            }
            ASTElementKind::Function { name, .. } => {
                if self.parent.is_some() {
                    self.parent.as_ref().unwrap().borrow().path() + "." + name
                } else {
                    name.clone()
                }
            }
            ASTElementKind::NewType { name, .. } => {
                if self.parent.is_some() {
                    self.parent.as_ref().unwrap().borrow().path() + "." + name
                } else {
                    name.clone()
                }
            }
            ASTElementKind::Class { span: _, name, .. } => {
                if self.parent.is_some() {
                    self.parent.as_ref().unwrap().borrow().path() + "." + name
                } else {
                    name.clone()
                }
            }
            ASTElementKind::ClassField { span: _, name, .. } => {
                if self.parent.is_some() {
                    self.parent.as_ref().unwrap().borrow().path() + "." + name
                } else {
                    name.clone()
                }
            }
            _ => unimplemented!(),
        }
    }

    pub fn slot_push(arena: &ASTArena, target: &ASTHandle, contents: ASTElement) {
        let new_idx = {
            let t2 = target.borrow();
            let mut idx_ref = t2.var_slot_idx.borrow_mut();
            let new_idx = *idx_ref;
            *idx_ref += 1;
            new_idx
        };
        ASTElement::slot_insert(arena, target, &new_idx.to_string(), contents);
    }

    pub fn slot_vec(&self) -> Vec<ASTHandle> {
        (0..*self.var_slot_idx.borrow())
            .map(|x| self.slot(&x.to_string()).unwrap())
            .collect()
    }

    pub fn slot(&self, slot: &str) -> Option<ASTHandle> {
        self.slots.borrow().get(slot).map(|x| x.to_owned())
    }

    pub fn slots(&self) -> Vec<String> {
        self.slots.borrow().keys().map(|x| x.to_owned()).collect()
    }
}

impl Deref for ASTElement {
    type Target = ASTElementKind;

    fn deref(&self) -> &Self::Target {
        &self.element
    }
}
