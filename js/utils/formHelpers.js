/**
 * formHelpers.js
 *
 * Example helper utilities for building common UI fields to reduce duplication.
 * Extend or modify as needed.
 */

/**
 * createNumberField(container, labelText, defaultValue)
 * - Creates a label + numeric <input> row, appends to 'container'
 * - Returns the input element for reading/writing value
 */
export function createNumberField(container, labelText, defaultValue = 0) {
  const row = document.createElement("div");
  row.textContent = labelText + ": ";

  const input = document.createElement("input");
  input.type = "number";
  input.value = defaultValue;
  input.style.marginLeft = "4px";

  row.appendChild(input);
  container.appendChild(row);
  return input;
}
