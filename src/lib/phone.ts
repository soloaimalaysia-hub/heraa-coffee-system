export function formatPhone(phone: string): string {
  const clean = phone.replace(/[\s-\(\)]/g, "");
  if (clean.startsWith("+")) return clean;
  if (clean.startsWith("0")) return "+6" + clean;
  if (clean.startsWith("6")) return "+" + clean;
  return clean;
}

export function toWhatsApp(phone: string): string {
  const formatted = formatPhone(phone);
  return formatted.startsWith("whatsapp:") ? formatted : `whatsapp:${formatted}`;
}
