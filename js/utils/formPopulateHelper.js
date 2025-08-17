import { populateAudioSelect } from "./audioSelector.js";
import { populateImageSelect } from "./imageSelector.js";

/**
 * populateAudioAndSet(selectEl, folderPath, defaultValue)
 * - Modular helper that:
 *   1) Populates the given <select> with sound files from folderPath
 *   2) Sets the select’s value to defaultValue (if present in the list)
 */
export function populateAudioAndSet(selectEl, folderPath, defaultValue) {
  return populateAudioSelect(selectEl, folderPath).then(() => {
    if (defaultValue) {
      // Only set if that option is actually in the list
      const option = selectEl.querySelector(`option[value="${defaultValue}"]`);
      if (option) {
        selectEl.value = defaultValue;
      }
    }
  });
}

/**
 * populateImagesAndSet(selectEl, folderPath, defaultValue)
 * - Similar approach for image-based <select> fields
 */
export function populateImagesAndSet(selectEl, folderPath, defaultValue) {
  return populateImageSelect(selectEl, folderPath).then(() => {
    if (defaultValue) {
      const option = selectEl.querySelector(`option[value="${defaultValue}"]`);
      if (option) {
        selectEl.value = defaultValue;
      }
    }
  });
}
