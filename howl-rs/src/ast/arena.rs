use std::borrow::Borrow;
use std::ops::Deref;
use std::rc::Rc;

use super::ASTElement;

#[cfg(feature = "use_accountable_refcell")]
type ArenaRefCell<T> = accountable_refcell::RefCell<T>;

#[cfg(feature = "use_accountable_refcell")]
type ArenaRef<'a, T> = accountable_refcell::Ref<'a, T>;

#[cfg(not(feature = "use_accountable_refcell"))]
type ArenaRefCell<T> = std::cell::RefCell<T>;

#[cfg(not(feature = "use_accountable_refcell"))]
type ArenaRef<'a, T> = std::cell::Ref<'a, T>;

#[derive(Clone)]
pub struct ASTHandle {
    arena_ref: Rc<ASTArenaInner>,
    id: usize,
}

impl ASTHandle {
    pub fn borrow(&self) -> impl Deref<Target = ASTElement> + '_ {
        let arena: &ASTArenaInner = self.arena_ref.borrow();
        ArenaRef::map(arena.elements.borrow(), |x| &x[self.id])
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
    elements: ArenaRefCell<Vec<ASTElement>>,
}

impl ASTArenaInner {
    pub fn new() -> ASTArenaInner {
        ASTArenaInner {
            elements: ArenaRefCell::new(Vec::new()),
        }
    }
}
