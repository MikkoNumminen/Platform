export function diffValues(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
): { oldValues: Record<string, unknown>; newValues: Record<string, unknown> } | null {
  const oldValues: Record<string, unknown> = {};
  const newValues: Record<string, unknown> = {};
  for (const key of Object.keys(newObj)) {
    if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      oldValues[key] = oldObj[key];
      newValues[key] = newObj[key];
    }
  }
  return Object.keys(oldValues).length > 0 ? { oldValues, newValues } : null;
}
