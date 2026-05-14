/**
 * Normalize user-entered Bangladesh mobile numbers to MSISDN `8801XXXXXXXXX`.
 */
export function normalizeBdPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits.length) return null;

  if (digits.startsWith("880") && digits.length === 13) {
    return digits;
  }
  if (digits.startsWith("0") && digits.length === 11) {
    return `88${digits}`;
  }
  if (digits.length === 10 && digits.startsWith("1")) {
    return `880${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `880${digits}`;
  }
  return null;
}
