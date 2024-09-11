export function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const dpr = window.devicePixelRatio;
    const displayWidth = Math.ceil(canvas.clientWidth * dpr);
    const displayHeight = Math.ceil(canvas.clientHeight * dpr);

    // Check if the canvas is not the same size.
    const needResize = canvas.width != displayWidth ||
        canvas.height != displayHeight;

    if (needResize) {
        // Make the canvas the same size
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }

    return needResize;
}