import { DoubleMatrix } from "../geometry/DoubleMatrix";
import { Tile } from "./Tile";
import { buildBuffer, buildProgram, buildVertexBuffer, compileShader, resizeCanvasToDisplaySize } from "./Utils";

export class RenderContext {
    gl: WebGL2RenderingContext;

    public readonly tileProgram: WebGLProgram;

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

        const vertexShader = compileShader(this, RenderContext.vertexShaderSource, gl.VERTEX_SHADER);
        const fragmentShader = compileShader(this, RenderContext.fragmentShaderSource, gl.FRAGMENT_SHADER);

        this.tileProgram = buildProgram(this, [
            vertexShader,
            fragmentShader,
        ]);
    }

    public dispose() {
        this.observer.disconnect();
    }

    public clear() {
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.depthRange(0, 1);
        this.gl.disable(this.gl.DEPTH_TEST);
        
        this.gl.clearColor(0.5, 0.5, 0.5, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    public renderTile(tile: WebGLTexture | undefined, worldViewProjectionMatrix: DoubleMatrix) {
        if (!tile)
                return;
        
        this.gl.useProgram(this.tileProgram);

        const z = 0;
        const vertexBuffer = buildVertexBuffer(this, [
            {x: -1, y: -1, z},
            {x: 1, y: -1, z},
            {x: 1, y: 1, z},
        ]);

        const textureCoordBuffer = buildBuffer(this, new Float32Array([
            0, 0,
            1, 0,
            1, 1,
        ]));

        const worldViewProjectionMatrixLocation = this.gl.getUniformLocation(this.tileProgram, "worldViewProjectionMatrix");
        const samplerLocation = this.gl.getUniformLocation(this.tileProgram, "sampler");
        const textureCoordLocation = this.gl.getAttribLocation(this.tileProgram, "textureCoord");
        const positionAttributeLocation = this.gl.getAttribLocation(this.tileProgram, "position");

        // Set up vertex stream
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.enableVertexAttribArray(positionAttributeLocation);
        this.gl.vertexAttribPointer(positionAttributeLocation, 4, this.gl.FLOAT, false, 0, 0);

        // Set up texture coordinates
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCoordBuffer);
        this.gl.enableVertexAttribArray(textureCoordLocation);
        this.gl.vertexAttribPointer(textureCoordLocation, 2, this.gl.FLOAT, false, 0, 0);

        // Set up texture
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, tile);
        this.gl.uniform1i(samplerLocation, 0);


        this.gl.uniformMatrix4fv(worldViewProjectionMatrixLocation, false, worldViewProjectionMatrix.toFloat32Array());

        this.gl.disable(this.gl.CULL_FACE)

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);

    }

    private static readonly vertexShaderSource = `
        precision mediump float;

        attribute vec4 position;

        uniform mat4 worldViewProjectionMatrix;

        varying float vertexColor;
        
        attribute vec2 textureCoord;
        varying highp vec2 vTextureCoord;

        void main() {
            gl_Position = worldViewProjectionMatrix * position;
            vertexColor = gl_Position.z / 2.0;
            vTextureCoord = textureCoord;
        }
    `;

    private static readonly fragmentShaderSource = `
        precision mediump float;

        uniform sampler2D sampler;

        varying float vertexColor;
        varying highp vec2 vTextureCoord;
        
        void main() {
            // gl_FragColor = vec4(vertexColor, 0.0, 0.0, 1.0);
            gl_FragColor = texture2D(sampler, vTextureCoord);
        }
    `;
}