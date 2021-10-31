use std::borrow::Borrow;
use std::ops::Deref;
use std::rc::Rc;

use super::ASTElement;

#[derive(Clone)]
pub struct ASTHandle {
    arena_ref: Rc<ASTArenaInner>,
    id: usize,
}

impl ASTHandle {
    pub fn as_ref(&self) -> impl Deref<Target = ASTElement> + '_ {
        let arena: &ASTArenaInner = self.arena_ref.borrow();
        accountable_refcell::Ref::map(arena.elements.borrow(), |x| &x[self.id])
    }
}

pub struct ASTArena {
    inner: Rc<ASTArenaInner>,
}

impl ASTArena {
    pub fn new() -> ASTArena {
        ASTArena {
            inner: Rc::new(ASTArenaInner::new()),
        }
    }

    pub fn insert(&self, element: ASTElement) -> ASTHandle {
        let arena: &ASTArenaInner = self.inner.borrow();
        let idx = arena.elements.borrow().len();
        arena.elements.borrow_mut().push(element);
        ASTHandle {
            arena_ref: self.inner.clone(),
            id: idx,
        }
    }
}

pub struct ASTArenaInner {
    elements: accountable_refcell::RefCell<Vec<ASTElement>>,
}

impl ASTArenaInner {
    pub fn new() -> ASTArenaInner {
        ASTArenaInner {
            elements: accountable_refcell::RefCell::new(Vec::new()),
        }
    }
}
