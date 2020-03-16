export enum LogLevel {
    Unknown,
    Error,
    Warning,
    Info,
    Debug,
}

export class Logger {
    private static globalLogLevel: LogLevel = LogLevel.Debug;
    private static logLevelText: Readonly<{[level in LogLevel]: string}> = {
        [LogLevel.Unknown]: '\x1b[31mUnknown\x1b[0m',
        [LogLevel.Error]: '\x1b[31mERROR\x1b[0m',
        [LogLevel.Warning]: '\x1b[33mWARN\x1b[0m',
        [LogLevel.Info]: '\x1b[36mINFO\x1b[0m',
        [LogLevel.Debug]: '\x1b[37mDebug\x1b[0m',
    };

    private readonly name: string;

    private constructor(name: string) {
        this.name = name;
    }

    /**
     * Logs a message of type "ERROR"
     * @param message
     */
    public error(message: any) {
        this.log(LogLevel.Error, message);
    }

    /**
     * Logs a message of type "WARN"
     * @param message
     */
    public warn(message: any) {
        this.log(LogLevel.Warning, message);
    }

    /**
     * Logs a message of type "INFO"
     * @param message
     */
    public info(message: any) {
        this.log(LogLevel.Info, message);
    }

    /**
     * Logs a message of type "DEBUG"
     * @param message
     */
    public debug(message: any) {
        this.log(LogLevel.Debug, message);
    }

    /**
     * Creates a new Logger.
     * @param type The class that will also be displayed in the log
     * @constructor
     */
    public static getLogger<T>(type: { new(...notUsed): T }): Logger {
        return new Logger(type.name);
    }

    /**
     * Sets the global log level of the application
     * @param minLogLevel Minimum log level that is printed
     */
    public static setGlobalLogLevel(minLogLevel: LogLevel) {
        this.globalLogLevel = minLogLevel;
        const lvlText = Logger.logLevelText[minLogLevel];
        console.log(`Log level is: [${lvlText}]`);
    }

    public static setGlobalLogLevelFromString(minLogLevel: string) {
        const lvl: LogLevel = LogLevel[minLogLevel];
        if (!lvl) {
            const error = new Error(`Invalid log level '${minLogLevel}'`);
            error.stack = error.stack.split('\n', 3).slice(0, 2).join('\n');
            throw error;
        }
        this.setGlobalLogLevel(lvl);
    }

    private shouldBeLogged(logLevel: LogLevel): boolean {
        return logLevel <= Logger.globalLogLevel;
    }

    private log(logLevel: LogLevel, ...args) {
        if (this.shouldBeLogged(logLevel)) {
            const timestamp = new Date().toUTCString();
            const lvlText = Logger.logLevelText[logLevel];

            console.log.apply(console, [`[${timestamp}][${lvlText}][${this.name}]`, ...args]);
        }
    }

}
