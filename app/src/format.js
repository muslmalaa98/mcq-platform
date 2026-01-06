function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Input format:
 * - subscript: H~2~O  => H<sub>2</sub>O
 * - superscript: x^2^ => x<sup>2</sup>
 *
 * Safe approach:
 * 1) escape HTML first
 * 2) then allow only <sub>/<sup> we generate
 */
export function formatSubSupSafe(text) {
  const safe = escapeHtml(text ?? "");

  // sub: ~...~
  const withSub = safe.replace(/~([^~]{1,20})~/g, (_, inner) => `<sub>${inner}</sub>`);
  // sup: ^...^
  const withSup = withSub.replace(/\^([^^]{1,20})\^/g, (_, inner) => `<sup>${inner}</sup>`);

  return withSup;
}
