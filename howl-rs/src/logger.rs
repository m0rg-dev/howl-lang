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
}

impl Logger {
    pub fn init(_opts: &Cli) {
        let mut logger = SINGLETON.lock().unwrap();
        *logger = Some(Logger {});
    }

    pub fn log(level: LogLevel, message: &str) {
        match level {
            LogLevel::Trace => eprint!("\x1b[34mTRACE\x1b[0m "),
            LogLevel::Info => eprint!("\x1b[37m INFO\x1b[0m "),
        }
        eprintln!("{}", message);
    }
}
