export function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

export function section(title: string, body: string): string {
  if (!body.trim()) return "";
  return `*${escapeMarkdown(title)}*\n${escapeMarkdown(body.trim())}`;
}
