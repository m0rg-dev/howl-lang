use std::sync::Mutex;

use crate::Cli;

lazy_static! {
    static ref SINGLETON: Mutex<Option<Logger>> = Mutex::new(None);
}

pub struct Logger {}

#[allow(dead_code)]
pub enum LogLevel {
    Trace,
    Info,
    Warning,
    Error,
}

impl Logger {
    pub fn init(_opts: &Cli) {
        let mut logger = SINGLETON.lock().unwrap();
        *logger = Some(Logger {});
    }

    pub fn log(level: LogLevel, message: &str) {
        match level {
            LogLevel::Trace => eprint!("\x1b[34m TRACE\x1b[0m "),
            LogLevel::Info => eprint!("\x1b[37m  INFO\x1b[0m "),
            LogLevel::Warning => eprint!("\x1b[33m  WARN\x1b[0m "),
            LogLevel::Error => eprint!("\x1b[31mERROR\x1b[0m "),
        }
        eprintln!("{}", message);
    }
}

#[macro_export]
macro_rules! log {
    ($level: expr, $format: expr, $($args:expr),+) => {
        Logger::log($level, &format!($format $(,$args)*))
    };
}
