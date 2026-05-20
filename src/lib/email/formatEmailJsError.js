export function formatEmailJsError(err) {
  if (err == null) return "Invite email failed to send.";
  if (typeof err === "string") return err;

  // EmailJS SDK rejects with EmailJSResponseStatus { status, text }
  const status =
    typeof err.status === "number"
      ? err.status
      : typeof err.statusCode === "number"
        ? err.statusCode
        : null;
  const text =
    typeof err.text === "string"
      ? err.text
      : typeof err.message === "string"
        ? err.message
        : null;

  if (text) {
    return status != null ? `${text} (${status})` : text;
  }
  if (status != null) {
    return `Invite email failed (HTTP ${status}).`;
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  const ownKeys = Object.keys(err);
  if (ownKeys.length > 0) {
    return ownKeys.map((key) => `${key}: ${String(err[key])}`).join("\n");
  }

  return "Invite email failed to send. Open DevTools → Network → api.emailjs.com for details.";
}
