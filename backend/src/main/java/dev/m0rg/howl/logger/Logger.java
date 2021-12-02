package dev.m0rg.howl.logger;

public class Logger {

    public static void log(LogLevel level, String message) {
        switch (level) {
            case Trace:
                System.err.println("\u001b[34mTRACE\u001b[0m " + message);
                break;
        }
    }

    public enum LogLevel {
        Trace
    }
}
