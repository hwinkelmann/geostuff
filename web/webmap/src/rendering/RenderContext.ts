import { resizeCanvasToDisplaySize } from "./Utils";

export class RenderContext {
    gl: WebGL2RenderingContext;
    
    private observer: ResizeObserver;


    constructor(public canvas: HTMLCanvasElement) {
        // Resize the canvas when the window is resized
        this.observer = new ResizeObserver(() => {
            resizeCanvasToDisplaySize(this.canvas);
        });
        this.observer.observe(canvas);
        
        const gl = canvas.getContext("webgl2");
        if (!gl)
            throw Error("WebGL not supported");

        this.gl = gl;
    }

    public dispose() {
        this.observer.disconnect();
    }
}