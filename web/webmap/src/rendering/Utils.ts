import { DoubleMatrix } from "../geometry/DoubleMatrix";
import { RenderContext } from "./RenderContext";

export function deg2Rad(degrees: number) {
    return degrees * Math.PI / 180;
}

export function rad2Deg(radians: number) {
    return radians / Math.PI * 180;
}

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

/**
 * Compiles a shader from source code and returns the shader object
 * @param context RenderContext instance
 * @param source Shader source
 * @param type context.gl.VERTEX_SHADER or context.gl.FRAGMENT_SHADER
 * @returns Compiled shader object
 */
export function compileShader(context: RenderContext, source: string, type: number) {
    const shader = context.gl?.createShader(type);
    if (!shader)
        throw new Error(`Could not create ${type === context.gl?.VERTEX_SHADER ? "vertex" : "fragment"} shader`);

    context.gl?.shaderSource(shader, source);
    context.gl?.compileShader(shader);
    if (!context.gl?.getShaderParameter(shader, context.gl.COMPILE_STATUS))
        throw new Error(`Could not compile ${type === context.gl?.VERTEX_SHADER ? "vertex" : "fragment"} shader:\n${context.gl?.getShaderInfoLog(shader)}`);

    return shader;
}

/**
 * Creates a program from a list of shaders
 * @param context RenderContext instance
 * @param shaders Shaders to attach to the program
 * @returns Created program
 */
export function buildProgram(context: RenderContext, shaders: WebGLShader[]) {
    const program = context.gl?.createProgram();
    if (!program)
        throw new Error("Could not create program");

    for (const shader of shaders)
        context.gl?.attachShader(program, shader);

    context.gl?.linkProgram(program);

    if (!context.gl?.getProgramParameter(program, context.gl.LINK_STATUS))
        throw new Error(`Could not link program:\n${context.gl?.getProgramInfoLog(program)}`);

    return program;
}

/**
 * Builds a vertex buffer from a list of vertices
 * @param context RenderContext instance
 * @param vertices List of vertices
 * @returns Created vertex buffer
 */
export function buildVertexBuffer(context: RenderContext, vertices: { x: number, y: number, z: number, w?: number }[]) {
    const array = new Float32Array(vertices.length * 4);
    for (let i = 0; i < vertices.length; i++) {
        array[i * 4] = vertices[i].x;
        array[i * 4 + 1] = vertices[i].y;
        array[i * 4 + 2] = vertices[i].z;
        array[i * 4 + 3] = vertices[i].w ?? 1;
    }

    return buildBuffer(context, array);
}

export function buildBuffer(context: RenderContext, data: Float32Array, target: number = context.gl?.ARRAY_BUFFER ?? 0, usage: number = context.gl?.STATIC_DRAW ?? 0) {
    const buffer = context.gl?.createBuffer();
    if (!buffer)
        throw new Error("Could not create buffer");

    context.gl?.bindBuffer(target, buffer);
    context.gl?.bufferData(target, data, usage);

    return buffer;
}

/**
 * Asynchronously loads a texture from a URL
 * @param context RenderContext instance
 * @param url URL of the texture
 * @param options Options
 * @returns WebGLTexture instance
 */
export async function loadTexture(context: RenderContext, url: string, options?: {
    generateMipmaps?: boolean;
    clampToEdge?: boolean;
}) {
    const image = new Image();
    image.src = url;


    function isPowerOf2(value: number) {
        return (value & (value - 1)) === 0;
    }

    return new Promise<WebGLTexture>((resolve, reject) => {
        image.onload = () => {
            const gl = context.gl;
            if (!gl) {
                reject("No GL context");
                return;
            }

            const texture = gl.createTexture();
            if (!texture)
                reject("Could not create texture");

            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                image);

            if (isPowerOf2(image.width) && isPowerOf2(image.height) && options?.generateMipmaps)
                gl.generateMipmap(gl.TEXTURE_2D);

            if (options?.clampToEdge) {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            }

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            resolve(texture!);
        }

        image.onerror = reject;
    });
}

/**
 * I assume the shaders have fixed names for uniforms and attributes if they use them:
 * 
 *  - worldViewProjectionMatrix
 * @param context 
 * @param program 
 * @param params 
 */
export function setBuffers(context: RenderContext, program: WebGLProgram, params: {
    vertexBuffer: WebGLBuffer;
    indexBuffer?: WebGLBuffer | null;
    textureCoordBuffer?: WebGLBuffer | null;
    colorBuffer?: WebGLBuffer | null;

    // texture?: WebGLTexture | null;
    color?: [number, number, number];
    [propName: string]: any;
}) {
    const gl = context.gl;
    if (!gl)
        throw new Error("No GL context");

    function setBuffer(propName: string, glslName: string, size: number, type = gl!.FLOAT) {
        if (!params[propName])
           return;

        const location = gl!.getAttribLocation(program, glslName);
        if (location === -1) {
            console.warn(`Attribute ${glslName} not found in program`);

            return;
        }
        gl!.bindBuffer(gl!.ARRAY_BUFFER, params[propName] as WebGLBuffer);
        gl!.enableVertexAttribArray(location);
        gl!.vertexAttribPointer(location, size, type, false, 0, 0);
    }

    setBuffer("vertexBuffer", "position", 3);
    setBuffer("textureCoordBuffer", "textureCoord", 2);
    setBuffer("colorBuffer", "color", 3);

    if (params.color)
        gl.uniform3fv(gl.getUniformLocation(program, "color"), params.color);

    if (params.indexBuffer)
        // No need to identify this buffer with a location. Index buffers
        // are ELEMENT_ARRAY_BUFFERs
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, params.indexBuffer);
}

export function setMatrices(context: RenderContext, program: WebGLProgram, params: {
    modelMatrix?: DoubleMatrix;
    viewMatrix?: DoubleMatrix;
    projectionMatrix?: DoubleMatrix;
    modelViewProjectionMatrix?: DoubleMatrix;
}) {
    const gl = context.gl;
    if (!gl)
        throw new Error("No GL context");

    function setUniformMatrix(name: string, matrix?: DoubleMatrix) {
        if (!matrix)
                return;

        const location = gl!.getUniformLocation(program, name);
        gl!.uniformMatrix4fv(location, false, matrix.toFloat32Array());
    }

    setUniformMatrix("projectionMatrix", params.projectionMatrix);
    setUniformMatrix("viewMatrix", params.viewMatrix);
    setUniformMatrix("modelMatrix", params.modelMatrix);

    if (params.modelViewProjectionMatrix)
        setUniformMatrix("modelViewProjectionMatrix", params.modelViewProjectionMatrix);
    else
        if (params.modelMatrix && params.viewMatrix && params.projectionMatrix) { 
            // const modelViewProjectionMatrix = params.modelMatrix.multiply(params.viewMatrix.multiply(params.projectionMatrix));
            const modelViewProjectionMatrix = params.projectionMatrix.multiply(params.viewMatrix.multiply(params.modelMatrix));
            setUniformMatrix("modelViewProjectionMatrix", modelViewProjectionMatrix);
        }
    }