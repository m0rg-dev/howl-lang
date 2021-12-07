package dev.m0rg.howl.logger;

public class Logger {

    public static void log(LogLevel level, String message) {
        switch (level) {
            case Trace:
                System.err.println("\u001b[34mTRACE\u001b[0m " + message);
                break;
            case Error:
                System.err.println("\u001b[31mERROR\u001b[0m " + message);
                break;
        }
    }

    public static void trace(String message) {
        log(LogLevel.Trace, message);
    }

    public static void error(String message) {
        log(LogLevel.Error, message);
    }

    public enum LogLevel {
        Trace,
        Error
    }
}
