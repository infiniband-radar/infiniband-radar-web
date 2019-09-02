enum LogLevel {
    Error = '\x1b[31mERROR\x1b[0m',
    Warning = '\x1b[33mWARN\x1b[0m',
    Info = '\x1b[36mINFO\x1b[0m',
    Debug = '\x1b[37mDebug\x1b[0m',
}

export class Logger {
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

    private log(logLevel: LogLevel, ...args) {
        console.log.apply(console, [`[${new Date().toUTCString()}][${logLevel}][${this.name}]`, ...args]);
    }

}
