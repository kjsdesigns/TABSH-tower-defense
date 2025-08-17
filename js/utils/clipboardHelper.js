/**
 * clipboardHelper.js
 * Exports a simple function to copy text to the user's clipboard.
 */

export function copyToClipboard(str) {
  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(str).then(() => {
      console.log("Copied to clipboard");
    }, (err) => {
      console.warn("Failed to copy to clipboard", err);
    });
  } else {
    // Fallback
    const textArea = document.createElement("textarea");
    textArea.value = str;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      console.log("Copied to clipboard (fallback)");
    } catch(e) {
      console.warn("Copy failed", e);
    }
    document.body.removeChild(textArea);
  }
}
