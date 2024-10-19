import { RenderContext } from "./RenderContext";

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
    const shader = context.gl.createShader(type);
    if (!shader)
        throw new Error("Could not create vertex shader");

    context.gl.shaderSource(shader, source);
    context.gl.compileShader(shader);
    if (!context.gl.getShaderParameter(shader, context.gl.COMPILE_STATUS))
        throw new Error(`Could not compile vertex shader:\n${context.gl.getShaderInfoLog(shader)}`);

    return shader;
}

/**
 * Creates a program from a list of shaders
 * @param context RenderContext instance
 * @param shaders Shaders to attach to the program
 * @returns Created program
 */
export function buildProgram(context: RenderContext, shaders: WebGLShader[]) {
    const program = context.gl.createProgram();
    if (!program)
        throw new Error("Could not create program");

    for (const shader of shaders)
        context.gl.attachShader(program, shader);

    context.gl.linkProgram(program);

    if (!context.gl.getProgramParameter(program, context.gl.LINK_STATUS))
        throw new Error(`Could not link program:\n${context.gl.getProgramInfoLog(program)}`);

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

export function buildBuffer(context: RenderContext, data: Float32Array, target: number = context.gl.ARRAY_BUFFER, usage: number = context.gl.STATIC_DRAW) {
    const buffer = context.gl.createBuffer();
    if (!buffer)
        throw new Error("Could not create buffer");

    context.gl.bindBuffer(target, buffer);
    context.gl.bufferData(target, data, usage);

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
            const texture = context.gl.createTexture();
            if (!texture)
                reject("Could not create texture");

            context.gl.bindTexture(context.gl.TEXTURE_2D, texture);
            context.gl.texImage2D(
                context.gl.TEXTURE_2D,
                0,
                context.gl.RGBA,
                context.gl.RGBA,
                context.gl.UNSIGNED_BYTE,
                image);

            if (isPowerOf2(image.width) && isPowerOf2(image.height) && options?.generateMipmaps)
                context.gl.generateMipmap(context.gl.TEXTURE_2D);

            if (options?.clampToEdge) {
                context.gl.texParameteri(context.gl.TEXTURE_2D, context.gl.TEXTURE_WRAP_S, context.gl.CLAMP_TO_EDGE);
                context.gl.texParameteri(context.gl.TEXTURE_2D, context.gl.TEXTURE_WRAP_T, context.gl.CLAMP_TO_EDGE);
            }

            context.gl.texParameteri(context.gl.TEXTURE_2D, context.gl.TEXTURE_MIN_FILTER, context.gl.LINEAR);

            resolve(texture!);
        }

        image.onerror = reject;
    });
}