/**
 * configSaver.js
 *
 * Exports a unified function to save config files to /api/saveConfig.
 */

export async function saveConfig(filePath, contentStr) {
  try {
    const resp = await fetch("/api/saveConfig", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath, content: contentStr })
    });
    const json = await resp.json();
    return json; // Typically { success: boolean, error?: string }
  } catch (err) {
    console.error("Error saving config:", err);
    return { success: false, error: err.message };
  }
}
