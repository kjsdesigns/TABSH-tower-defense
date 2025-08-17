import { EditorBaseUI } from "./editorBaseUI.js";

/**
 * CanvasEditorBaseUI extends EditorBaseUI to provide a canvas-based approach
 * for editors that need interactive drawing (e.g., Level Editor).
 */
export class CanvasEditorBaseUI extends EditorBaseUI {
  /**
   * initCanvas
   * - Creates and configures a canvas inside the provided container
   * - Returns the canvas element for further use
   */
  initCanvas(contentDiv, width = 800, height = 600) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.style.border = "1px solid #666";
    canvas.style.display = "block";
    canvas.style.margin = "8px 0";

    contentDiv.appendChild(canvas);
    return canvas;
  }
}
