import { fragmentShaderSource, vertexShaderSource } from "../shaders/TileShader";
import { buildProgram, compileShader, resizeCanvasToDisplaySize } from "./Utils";

export class RenderContext {
    public gl: WebGL2RenderingContext | undefined;

    public tileProgram: WebGLProgram | undefined;

    private observer: ResizeObserver | undefined;

    public locations: {
        worldViewProjectionMatrix: WebGLUniformLocation | null;
        sampler: WebGLUniformLocation | null;
        textureCoord: number;
        position: number;
        color: number;
    } = {
        worldViewProjectionMatrix: null,
        sampler: null,
        textureCoord: -1,
        position: -1,
        color: -1,
    }


    constructor(public canvas: HTMLCanvasElement) {
        this.init(canvas);
    }

    public init(canvas: HTMLCanvasElement) {
        // Resize the canvas when the window is resized
        if (this.observer)
            this.observer.disconnect();

        this.observer = new ResizeObserver(() => {
            resizeCanvasToDisplaySize(this.canvas);
        });
        this.observer.observe(canvas);

        const gl = canvas.getContext("webgl2");
        if (!gl)
            throw new Error("WebGL not supported");

        this.gl = gl;

        const vertexShader = compileShader(this, vertexShaderSource, gl.VERTEX_SHADER);
        const fragmentShader = compileShader(this, fragmentShaderSource, gl.FRAGMENT_SHADER);

        if (this.tileProgram)
            gl.deleteProgram(this.tileProgram);

        this.tileProgram = buildProgram(this, [
            vertexShader,
            fragmentShader,
        ]);

        this.locations = {
            worldViewProjectionMatrix: gl.getUniformLocation(this.tileProgram, "worldViewProjectionMatrix"),
            sampler: gl.getUniformLocation(this.tileProgram, "sampler"),
            textureCoord: gl.getAttribLocation(this.tileProgram, "textureCoord"),
            position: gl.getAttribLocation(this.tileProgram, "position"),
            color: gl.getAttribLocation(this.tileProgram, "color"),
        };
    }

    public dispose() {
        this.observer?.disconnect();

        if (this.tileProgram)
            this.gl?.deleteProgram(this.tileProgram);
    }

    public clear() {
        this.gl?.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl?.depthRange(-1, 1);
        this.gl?.enable(this.gl.DEPTH_TEST);

        this.gl?.enable(this.gl.CULL_FACE);
        this.gl?.frontFace(this.gl.CCW);
        
        this.gl?.clearColor(0.5, 0.5, 0.5, 1.0);
        this.gl?.clearDepth(1.0);
        this.gl?.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
}