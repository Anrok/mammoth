const int8DataTypes = new Set(['int8', 'bigint', 'bigserial', 'serial8']);

export function validateInt8Parameter(dataType: string, columnName: string, value: unknown): void {
  if (
    typeof value === 'number' &&
    int8DataTypes.has(dataType) &&
    (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER)
  ) {
    throw new Error(
      `int8 value is out-of-range for JS number in column "${columnName}": ${JSON.stringify(value)}.`,
    );
  }
}
