package dev.m0rg.howl.logger;

import dev.m0rg.howl.Compiler;

public class Logger {
    public static final String OK = "\u001b[32m✔︎\u001b[0m";
    public static final String Error = "\u001b[31m✘\u001b[0m";

    public static void log(LogLevel level, String message) {
        switch (level) {
            case Trace:
                if (Compiler.cmd.hasOption("trace")) {
                    System.err.println("\u001b[34mTRACE\u001b[0m " + message);
                }
                break;
            case Info:
                System.err.println(" INFO " + message);
                break;
            case Warn:
                System.err.println("\u001b[33m WARN\u001b[0m " + message);
                break;
            case Error:
                System.err.println("\u001b[31mERROR\u001b[0m " + message);
                break;
        }
    }

    public static void trace(String message) {
        log(LogLevel.Trace, message);
    }

    public static void info(String message) {
        log(LogLevel.Info, message);
    }

    public static void warn(String message) {
        log(LogLevel.Warn, message);
    }

    public static void error(String message) {
        log(LogLevel.Error, message);
    }

    public enum LogLevel {
        Trace,
        Info,
        Warn,
        Error
    }
}
