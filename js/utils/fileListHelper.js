/**
 * fileListHelper.js
 *
 * Provides a single function for editors to call:
 *   listFiles('config/enemies'), listFiles('config/heroes'), etc.
 *
 * Rewritten to avoid any special backslash escapes or embedded template strings.
 */

export async function listFiles(dir) {
  try {
    // We'll build the URL in a simple way, no backslash escapes:
    const url = "/api/listFiles?dir=" + encodeURIComponent(dir);
    const resp = await fetch(url);
    const json = await resp.json();

    if (json.files) {
      return json.files;
    }
    return [];
  } catch (err) {
    console.error("Error listing files from", dir, err);
    return [];
  }
}
