use std::borrow::Borrow;
use std::cell::RefCell;
use std::collections::HashMap;
use std::ops::Deref;
use std::rc::Rc;

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

    pub fn as_cloned(&self) -> ASTElement {
        self.as_ref().clone()
    }
}

impl std::fmt::Debug for ASTHandle {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "ASTHandle {} => {:#?}", self.id, self.as_ref().deref())
    }
}

#[derive(Clone)]
pub struct ASTElement {
    pub parent: Option<ASTHandle>,
    pub element: ASTElementKind,
    slots: RefCell<HashMap<String, ASTHandle>>,
    var_slot_idx: RefCell<usize>,
}

impl std::fmt::Debug for ASTElement {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let mut builder = f.debug_struct("ASTElement");
        if self.parent.is_some() {
            builder.field("parent", &self.parent.as_ref().unwrap().id);
        }

        match &self.element {
            ASTElementKind::Module { .. } => {
                builder.field("type", &"Module");
                builder.field("path", &self.path());
            }
        }

        builder.field("slots", &self.slots.borrow()).finish()
    }
}

#[derive(Debug, Clone)]
pub enum ASTElementKind {
    Module { name: String },
}

impl ASTArenaInner {
    pub fn new() -> ASTArenaInner {
        ASTArenaInner {
            elements: accountable_refcell::RefCell::new(Vec::new()),
        }
    }
}

impl ASTElement {
    pub fn new(parent: Option<ASTHandle>, element: ASTElementKind) -> ASTElement {
        ASTElement {
            parent,
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

    pub fn slot_insert(arena: &ASTArena, target: &ASTHandle, slot: &str, contents: ASTElement) {
        let new_handle = arena.insert(contents.with_parent(target));
        let target = target.as_ref();
        target
            .slots
            .borrow_mut()
            .insert(slot.to_owned(), new_handle);
    }

    pub fn path(&self) -> String {
        #[allow(unreachable_patterns)]
        match &self.element {
            ASTElementKind::Module { name } => {
                if self.parent.is_some() {
                    self.parent.as_ref().unwrap().as_ref().path() + "." + name
                } else {
                    name.clone()
                }
            }
            _ => unimplemented!(),
        }
    }

    #[allow(dead_code)]
    pub fn slot_push(arena: &ASTArena, target: &ASTHandle, contents: ASTElement) {
        let new_idx = {
            let t2 = target.as_ref();
            let mut idx_ref = t2.var_slot_idx.borrow_mut();
            let new_idx = *idx_ref;
            *idx_ref += 1;
            new_idx
        };
        ASTElement::slot_insert(arena, target, &new_idx.to_string(), contents);
    }

    #[allow(dead_code)]
    pub fn slot(&self, slot: &str) -> Option<ASTHandle> {
        self.slots.borrow().get(slot).map(|x| x.to_owned())
    }
}

impl Deref for ASTElement {
    type Target = ASTElementKind;

    fn deref(&self) -> &Self::Target {
        &self.element
    }
}
