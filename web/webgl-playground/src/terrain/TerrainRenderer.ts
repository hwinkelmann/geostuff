import { GlHelpers } from "./GlHelpers";

export class TerrainRenderer {
    private canvas: HTMLCanvasElement;
    private gl: WebGLRenderingContext;

    private program: WebGLProgram;

    constructor(private parent: HTMLDivElement, private pixelRatio: number = 1) {
        const canvas = document.createElement("canvas");
        parent.appendChild(canvas);

        const gl = canvas.getContext("webgl");
        if (!gl) {
            throw new Error("Unable to use WebGL. Your device may not support it.");
        }

        this.canvas = canvas;
        this.gl = gl;

        this.program = GlHelpers.createProgram(this.gl, this.vertexShader, this.fragmentShader);
    }

    public render() {
        // Set size
        this.canvas.width = Math.floor(this.parent.clientWidth * this.pixelRatio);
        this.canvas.height = Math.floor(this.parent.clientHeight * this.pixelRatio);

        const gl = this.gl;

        gl.clearColor(0, 0.5, 1, 1);
        gl.clearDepth(1);
        gl.enable(gl.DEPTH_TEST); // Enable depth testing
        gl.depthFunc(gl.LEQUAL); // Near things obscure far things
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(this.program);
    }

    public destroy() {
        this.parent.removeChild(this.canvas);
    }

    private readonly vertexShader = `
        uniform float scale;

        attribute vec2 position;
        attribute vec3 color;
        
        uniform mat4 projectionMatrix;
        uniform mat4 modelViewMatrix;
        
        varying mediump vec3 vColor;
        
        void main(void) {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position * scale, 0.1, 1.0);
            vColor = color;
        }
    `;

    private readonly fragmentShader = `
        varying mediump vec3 vColor;

        void main(void) {
            gl_FragColor = vec4(vColor, 1.0);
        }
    `;
}