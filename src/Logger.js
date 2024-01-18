export class Logger {
  log(level, message) {
    console.log(`[${level.toUpperCase()}]: ${message}`);
  }

  error(message) {
    this.log("error", message);
  }

  warn(message) {
    this.log("warn", message);
  }

  info(message) {
    this.log("info", message);
  }

  debug(message) {
    this.log("debug", message);
  }

  fatal(message) {
    this.log("fatal", message);
  }
}

export default Logger;
