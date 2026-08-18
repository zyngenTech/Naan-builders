/**
 * Strips everything except digits from a phone number - used specifically
 * for building wa.me links. WhatsApp's click-to-chat API requires the
 * number as plain digits with country code and NO leading "+", spaces, or
 * dashes (e.g. "919000000000", not "+91 90000 00000") - passing a "+"
 * produces an invalid/broken wa.me link. This sanitizes whatever format
 * was entered (Admin form, environment default, or a manually-edited
 * Firestore document) so the link always works regardless of source.
 */
export function toWhatsAppDigits(raw: string): string {
  return (raw || '').replace(/\D/g, '');
}
