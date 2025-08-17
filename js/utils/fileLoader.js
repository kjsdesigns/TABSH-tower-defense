/**
 * fileLoader.js
 * 
 * Provides shared "fetchConfigFile" and "parseConfigFile" functions for 
 * reliable loading from the server. After saving a config, re-fetch it 
 * to ensure the editor sees updated data.
 */

import { listFiles } from "./fileListHelper.js";

/**
 * fetchConfigFile(dir, fileName)
 * - Example: fetchConfigFile("config/enemies", "drone.js")
 * - Returns raw text (JS code) from the server
 */
export async function fetchConfigFile(dir, fileName) {
  if (!fileName) {
    console.warn("fetchConfigFile: fileName is empty");
    return "";
  }

  const url = `/api/getConfig?dir=${encodeURIComponent(dir)}&file=${encodeURIComponent(fileName)}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Fetch error: ${resp.status} for ${url}`);
    }
    const text = await resp.text();
    return text;
  } catch (err) {
    console.error("fetchConfigFile error:", err);
    // Rethrow so callers can catch or handle
    throw err;
  }
}

/**
 * parseConfigFile(fileContents)
 * - We expect something like: export const XyzData = { ... }
 *   or export const XyzConfig = { ... }
 * - We only want the JSON portion. If we can't parse, return {}
 */
export function parseConfigFile(fileContents) {
  if (!fileContents || typeof fileContents !== "string") {
    console.warn("parseConfigFile: no content to parse");
    return {};
  }
  const match = fileContents.match(/\{[\s\S]*\}/);
  if (!match) {
    console.warn("parseConfigFile: no object found in file content");
    return {};
  }
  try {
    const jsonStr = match[0];
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("parseConfigFile JSON error:", err);
    return {};
  }
}
