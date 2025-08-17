/**
 * imageSelector.js
 *
 * Export a function to populate a <select> or any UI with images from 
 * a given directory, e.g. assets/enemies, assets/towers, etc.
 */

import { listFiles } from "./fileListHelper.js";

export async function populateImageSelect(selectEl, folderPath) {
  const files = await listFiles(folderPath);
  selectEl.innerHTML = "";

  const noneOpt = document.createElement("option");
  noneOpt.value = "";
  noneOpt.textContent = "(none)";
  selectEl.appendChild(noneOpt);

  files.forEach(file => {
    // filter for .png, .jpg, .gif, etc.
    if (!/\.(png|jpg|jpeg|gif)$/i.test(file)) return;
    const opt = document.createElement("option");
    opt.value = file;
    opt.textContent = file;
    selectEl.appendChild(opt);
  });
}
