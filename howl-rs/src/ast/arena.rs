use std::borrow::Borrow;
use std::ops::Deref;
use std::rc::Rc;

use super::{ASTElement, ASTElementKind};

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

    pub fn arena(&self) -> ASTArena {
        ASTArena {
            inner: self.arena_ref.clone(),
        }
    }

    pub fn slot_insert(&self, slot: &str, contents: ASTElement) -> ASTHandle {
        let new_handle = self.arena().insert(contents.with_parent(self));
        let target = self.borrow();
        target
            .slots
            .borrow_mut()
            .insert(slot.to_owned(), new_handle.clone());
        new_handle
    }

    pub fn slot_insert_handle(&self, slot: &str, contents: ASTHandle) {
        let target = self.borrow();
        target
            .slots
            .borrow_mut()
            .insert(slot.to_owned(), contents.clone());
    }

    pub fn slot_push(&self, contents: ASTElement) {
        let new_idx = {
            let t2 = self.borrow();
            let mut idx_ref = t2.var_slot_idx.borrow_mut();
            let new_idx = *idx_ref;
            *idx_ref += 1;
            new_idx
        };
        self.slot_insert(&new_idx.to_string(), contents);
    }

    pub fn path_create(&self, root_module: &ASTHandle, path: &str) -> ASTHandle {
        self.path_create_rec(root_module, path)
    }

    fn path_create_rec(&self, root_module: &ASTHandle, path: &str) -> ASTHandle {
        let components: Vec<&str> = path.split(".").collect();
        let slot_contents = { root_module.borrow().slot(components[0]) };
        let submodule = match slot_contents {
            Some(el) => el,
            None => {
                let new_element = ASTElement::new(ASTElementKind::Module {
                    name: components[0].to_string(),
                });

                root_module.slot_insert(components[0], new_element)
            }
        };
        if components.len() > 1 {
            self.path_create_rec(&submodule, &components[1..].join("."))
        } else {
            submodule
        }
    }

    pub fn path_set(&self, root_module: &ASTHandle, path: &str, element: ASTHandle) {
        let mut components: Vec<&str> = path.split(".").collect();
        let last = components.pop().unwrap();
        let parent = self.path_create(root_module, &components.join("."));
        parent.slot_insert_handle(last, element);
    }

    pub fn copy_transform<T>(&self, callback: &T) -> ASTHandle
    where
        T: Fn(&str, &ASTArena, ASTElement) -> ASTHandle,
    {
        let rc = ASTArena::new();
        let new_root = rc.insert(ASTElement::new(self.borrow().element.clone()));
        for slot in self.borrow().slots() {
            eprintln!(".{}", slot);
            let new_element = callback(
                &(".".to_owned() + &slot),
                &rc,
                self.borrow().slot(&slot).unwrap().borrow().clone(),
            )
            .borrow()
            .clone();
            new_root.slot_insert(&slot, new_element);
        }

        ASTElement::walk(&self.borrow(), "".to_string(), &|path, handle| {
            eprintln!("{}", path);
            let new_element = callback(&path, &rc, handle.borrow().clone());
            self.path_set(&new_root, &path, new_element);
        });

        return new_root;
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
