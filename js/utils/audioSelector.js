/**
 * audioSelector.js
 *
 * Exports a function to populate a <select> with actual files from assets/sounds.
 */

import { listFiles } from "./fileListHelper.js";

export async function populateAudioSelect(selectEl) {
  const files = await listFiles("assets/sounds");
  // Clear existing options
  selectEl.innerHTML = "";

  // Add a "(none)" option
  const noneOpt = document.createElement("option");
  noneOpt.value = "";
  noneOpt.textContent = "(none)";
  selectEl.appendChild(noneOpt);

  files.forEach(file => {
    // filter out non-audio if needed
    if (!file.endsWith(".mp3") && !file.endsWith(".wav")) return;
    const opt = document.createElement("option");
    opt.value = file;
    opt.textContent = file;
    selectEl.appendChild(opt);
  });
}
