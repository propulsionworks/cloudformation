/**
 * This file implements functionality from `node:assert` so that Node is not a
 * dependency.
 */

export class AssertionError extends Error {
  public readonly actual: unknown;
  public readonly expected: unknown;
  public readonly operator: string | undefined;
  public readonly generatedMessage: boolean;
  public readonly code = "ERR_ASSERTION";

  public constructor(
    options: {
      message?: string | undefined;
      actual?: unknown;
      expected?: unknown;
      operator?: string | undefined;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      stackStartFn?: Function | undefined;
    } = {},
    errorOptions?: ErrorOptions,
  ) {
    const {
      actual,
      expected,
      operator,
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      message = `${actual} ${operator} ${expected}`,
      stackStartFn,
    } = options;

    super(message, errorOptions);
    this.name = "AssertionError";
    this.actual = actual;
    this.expected = expected;
    this.generatedMessage = !options.message;
    this.operator = operator;

    if (stackStartFn) {
      Error.captureStackTrace(this, stackStartFn);
    }
  }
}

export function assert(
  condition: unknown,
  message?: string,
): asserts condition {
  if (!condition) {
    throw new AssertionError({
      actual: false,
      expected: true,
      operator: "==",
      message,
      stackStartFn: assert,
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function assertType<T>(value: unknown): asserts value is T {}
