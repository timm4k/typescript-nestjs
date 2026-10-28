export function requireNonNegativeFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite non-negative number`);
  }
}

export function requireNonEmptyText(value: string, name: string): string {
  const cleaned = value.trim();
  if (cleaned.length === 0) {
    throw new Error(`${name} must not be empty`);
  }
  return cleaned;
}

export function validateCustomerInput(input: unknown): string {
  if (typeof input !== "string") {
    throw new TypeError("Customer email must be a string");
  }

  const email = requireNonEmptyText(input, "Customer email");
  if (!email.includes("@")) {
    throw new Error("Customer email must contain @");
  }
  return email;
}

export function parsePositiveInteger(input: string, name: string): number {
  const value = input.trim();
  if (!/^[0-9]+$/.test(value)) {
    throw new RangeError(`${name} must be a positive whole number`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new RangeError(`${name} must be a positive safe integer`);
  }
  return parsed;
}
