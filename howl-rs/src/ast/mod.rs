use std::cell::RefCell;
use std::collections::HashMap;
use std::ops::Deref;
use std::path::PathBuf;
use std::rc::Rc;

use crate::ast::pretty_print::pretty_print;
use crate::log;
use crate::logger::LogLevel;

pub mod pretty_print;
pub mod types;

pub const ARITHMETIC_EXPRESSION_LHS: &str = "__lhs";
pub const ARITHMETIC_EXPRESSION_RHS: &str = "__rhs";
pub const ASSIGNMENT_STATEMENT_LHS: &str = "__lhs";
pub const ASSIGNMENT_STATEMENT_RHS: &str = "__rhs";
pub const CLASS_EXTENDS: &str = "__extends";
pub const CLASS_FIELD_TYPE: &str = "__type";
pub const CONSTRUCTOR_CALL_EXPRESSION_SOURCE: &str = "__source";
pub const ELSE_IF_STATEMENT_BODY: &str = "__body";
pub const ELSE_IF_STATEMENT_CONDITION: &str = "__body";
pub const ELSE_STATEMENT_BODY: &str = "__body";
pub const FIELD_REFERENCE_EXPRESSION_SOURCE: &str = "__source";
pub const FUNCTION_BODY: &str = "__body";
pub const FUNCTION_CALL_EXPRESSION_SOURCE: &str = "__source";
pub const FUNCTION_RETURN: &str = "__return";
pub const IF_STATEMENT_BODY: &str = "__body";
pub const IF_STATEMENT_CONDITION: &str = "__condition";
pub const INDEX_EXPRESSION_INDEX: &str = "__index";
pub const INDEX_EXPRESSION_SOURCE: &str = "__source";
pub const LOCAL_DEFINITION_STATEMENT_INITIALIZER: &str = "__initializer";
pub const LOCAL_DEFINITION_STATEMENT_TYPE: &str = "__type";
pub const RAW_POINTER_TYPE_INNER: &str = "__inner";
pub const RETURN_STATEMENT_EXPRESSION: &str = "__expression";
pub const SIMPLE_STATEMENT_EXPRESSION: &str = "__expression";
pub const SPECIFIED_TYPE_BASE: &str = "__base";
pub const STATIC_TABLE_REFERENCE_SOURCE: &str = "__source";
pub const TEMPORARY_SOURCE: &str = "__source";
pub const THROW_STATEMENT_EXPRESSION: &str = "__expression";
pub const TYPE_DEFINITION: &str = "__definition";
pub const WHILE_STATEMENT_BODY: &str = "__body";
pub const WHILE_STATEMENT_CONDITION: &str = "__condition";

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

    pub fn clone_tree(&self) -> ASTElement {
        let new_element = ASTElement::new(self.element());
        self.slots().into_iter().for_each(|(name, el)| {
            log!(LogLevel::Trace, "clone_tree {} {}", self.path(), name);
            new_element.slot_insert(&name, el.clone_tree());
        });
        new_element
    }

    pub fn slot_clone(&mut self, source: &ASTElement) {
        source.slots().into_iter().for_each(|(name, el)| {
            self.slot_insert(&name, el.clone_tree());
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

    pub fn transform_bottom_up<T>(self, path: String, callback: &T) -> ASTElement
    where
        T: Fn(String, ASTElement) -> ASTElement,
    {
        self.slots().into_iter().for_each(|(name, mut element)| {
            element = element.transform_bottom_up(path.clone() + "." + &name, callback);
            self.slot_insert(&name, element);
        });

        callback(path, self.clone())
    }

    pub fn path(&self) -> String {
        let parent = match &self.inner.borrow().parent {
            Some(el) => el.path() + ".",
            None => "".to_string(),
        };

        if let Some(parent_element) = &self.inner.borrow().parent {
            let own = parent_element
                .slots()
                .into_iter()
                .filter(|(_, element)| Rc::ptr_eq(&self.inner, &element.inner))
                .map(|(slot, _)| slot)
                .collect::<Vec<String>>()
                .pop();
            if own.is_some() {
                parent + &own.unwrap()
            } else {
                panic!(
                    "tree bidirectionality failure. {:?} {:?}",
                    self.element(),
                    parent_element.element()
                )
            }
        } else {
            "".to_string()
        }
    }

    pub fn parent(&self) -> Option<ASTElement> {
        self.inner.borrow().parent.as_ref().map(|x| x.clone())
    }

    pub fn handle(&self) -> String {
        self.path().replace(".", "_")
    }
}

pub struct ASTElementCommon {
    pub parent: Option<ASTElement>,
    pub element: ASTElementKind,
    slots: RefCell<HashMap<String, ASTElement>>,
}

#[derive(Clone)]
pub struct SourcedSpan {
    pub source_path: PathBuf,
    pub span: lrpar::Span,
}

impl std::fmt::Debug for SourcedSpan {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "<...>")
    }
}

#[derive(Clone, Debug)]
pub enum ASTElementKind {
    ArithmeticExpression {
        span: SourcedSpan,
        operator: String,
    },
    AssignmentStatement {
        span: SourcedSpan,
    },
    Class {
        span: SourcedSpan,
        name: String,
        generic_order: Vec<String>,
    },
    ClassField {
        span: SourcedSpan,
        name: String,
    },
    CompoundStatement {
        span: SourcedSpan,
    },
    ConstructorCallExpression {
        span: SourcedSpan,
    },
    ElseIfStatement {
        span: SourcedSpan,
    },
    ElseStatement {
        span: SourcedSpan,
    },
    FieldReferenceExpression {
        span: SourcedSpan,
        name: String,
    },
    Function {
        span: SourcedSpan,
        is_static: bool,
        name: String,
        unique_name: String,
        argument_order: Vec<String>,
    },
    FFICallExpression {
        span: SourcedSpan,
        name: String,
    },
    FunctionCallExpression {
        span: SourcedSpan,
    },
    IfStatement {
        span: SourcedSpan,
    },
    IndexExpression {
        span: SourcedSpan,
    },
    Interface {
        span: SourcedSpan,
        name: String,
    },
    LocalDefinitionStatement {
        span: SourcedSpan,
        name: String,
    },
    MacroCallExpression {
        span: SourcedSpan,
        name: String,
    },
    Module {
        name: String,
        searchpath: Vec<String>,
    },
    NamedType {
        span: SourcedSpan,
        abspath: String,
    },
    NameExpression {
        span: SourcedSpan,
        name: String,
    },
    NewType {
        name: String,
    },
    NumberExpression {
        span: SourcedSpan,
        value: String,
    },
    RawPointerType {
        span: SourcedSpan,
    },
    ReturnStatement {
        span: SourcedSpan,
    },
    SimpleStatement {
        span: SourcedSpan,
    },
    SpecifiedType {
        span: SourcedSpan,
    },
    #[allow(dead_code)]
    StaticTableReference {
        span: SourcedSpan,
    },
    StringExpression {
        span: SourcedSpan,
        value: String,
    },
    Temporary {
        name: String,
    },
    ThrowStatement {
        span: SourcedSpan,
    },
    UnresolvedIdentifier {
        span: SourcedSpan,
        name: String,
        namespace: String,
    },
    UnresolvedMethod {
        name: String,
    },
    WhileStatement {
        span: SourcedSpan,
    },
    Placeholder(),
}

impl Deref for ASTElementCommon {
    type Target = ASTElementKind;

    fn deref(&self) -> &Self::Target {
        &self.element
    }
}

pub fn generate_unique_name_function(name: &str, arg_types: Vec<ASTElement>) -> String {
    format!(
        "F{}{}E{}",
        name_string(name),
        arg_types.len(),
        arg_types
            .iter()
            .map(type_string)
            .collect::<Vec<String>>()
            .join("")
    )
}

pub fn generate_unique_name_type(name: &str, arg_types: Vec<ASTElement>) -> String {
    format!(
        "T{}{}E{}",
        name_string(name),
        arg_types.len(),
        arg_types
            .iter()
            .map(type_string)
            .collect::<Vec<String>>()
            .join("")
    )
}

fn name_string(source: &str) -> String {
    format!("{}{}", source.len(), source)
}

fn type_string(source: &ASTElement) -> String {
    match source.element() {
        ASTElementKind::RawPointerType { .. } => {
            format!(
                "R{}",
                type_string(&source.slot(RAW_POINTER_TYPE_INNER).unwrap())
            )
        }
        ASTElementKind::SpecifiedType { .. } => {
            format!(
                "S{}{}E{}",
                type_string(&source.slot(SPECIFIED_TYPE_BASE).unwrap()),
                source.slot_vec().len(),
                source
                    .slot_vec()
                    .iter()
                    .map(type_string)
                    .collect::<Vec<String>>()
                    .join("")
            )
        }
        ASTElementKind::NamedType { abspath, .. } => name_string(&abspath.replace(".", "_")),
        ASTElementKind::UnresolvedIdentifier { name, .. } => name_string(&name),
        _ => unimplemented!(
            "Unimplemented in type_string: {}",
            pretty_print(source.clone())
        ),
    }
}
