import chalk from "chalk";
import { format } from "node:util";

export type SchemaProblem = {
  location: string;
  message: string;
  severity: "error" | "warn";
};

/**
 * Object to report problems encountered.
 */
export type SchemaProblemReporter = {
  error: (location: string, ...args: unknown[]) => void;
  warn: (location: string, ...args: unknown[]) => void;
};

/**
 * {@link SchemaProblemReporter} implementation which reports issues to the
 * console.
 */
export class ConsoleProblemReporter implements SchemaProblemReporter {
  readonly #reported = new Set<string>(); // track what we reported already

  public error(location: string, ...args: unknown[]): void {
    this.#report(
      format(`${chalk.red("error")} ${chalk.gray(location)}`, ...args),
    );
  }

  public warn(location: string, ...args: unknown[]): void {
    this.#report(
      format(`${chalk.yellow("warn")} ${chalk.gray(location)}`, ...args),
    );
  }

  #report(message: string): void {
    if (!this.#reported.has(message)) {
      console.error(message);
      this.#reported.add(message);
    }
  }
}

/**
 * {@link SchemaProblemReporter} implementation which stores problems in an
 * array.
 */
export class SilentProblemReporter implements SchemaProblemReporter {
  public readonly problems: SchemaProblem[] = [];

  public error(location: string, ...args: unknown[]): void {
    this.problems.push({
      location,
      message: format(...args),
      severity: "error",
    });
  }

  public warn(location: string, ...args: unknown[]): void {
    this.problems.push({
      location,
      message: format(...args),
      severity: "warn",
    });
  }
}
