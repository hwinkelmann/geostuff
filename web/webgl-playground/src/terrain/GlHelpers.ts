export class GlHelpers {
    /**
     * Creates a webgl program from vertex and fragment shader source code
     * @param gl WebGL context
     * @param vertexShader Source code of the vertex shader
     * @param fragmentShader Source code of the fragment shader
     * @returns WebGL program
     */
    public static createProgram(gl: WebGLRenderingContext, vertexShader: string, fragmentShader: string) {
        const program = gl.createProgram();
        if (!program)
            throw new Error("Unable to create program");

        gl.attachShader(program, GlHelpers.createShader(gl, gl.VERTEX_SHADER, vertexShader));
        gl.attachShader(program, GlHelpers.createShader(gl, gl.FRAGMENT_SHADER, fragmentShader));
        gl.linkProgram(program);

        return program;
    }

    /**
     * Creates a webgl shader from source code
     * @param gl WebGL context
     * @param shaderType gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
     * @param src Source code of the shader
     * @returns Initialized WebGL shader
     */
    public static createShader(gl: WebGLRenderingContext, shaderType: number, src: string) {
        const shader = gl.createShader(shaderType);
        if (!shader)
            throw new Error("Unable to create shader");

        gl.shaderSource(shader, src);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
            throw new Error(gl.getShaderInfoLog(shader)?.toString());

        return shader;
    }


    /**
     * Async texture loader. Immediately returns a pink dummy texture, and replaces 
     * it with the actual texture when it's loaded.
     * @param gl WebGL context
     * @param url URL of the texture
     * @returns WebGL texture 
     */
    public static loadTexture(gl: WebGLRenderingContext, url: string) {
        const texture = gl.createTexture();
        if (!texture)
            throw new Error("Unable to create texture");

        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Because images have to be downloaded over the internet
        // they might take a moment until they are ready.
        // Until then put a single pixel in the texture so we can
        // use it immediately. When the image has finished downloading
        // we'll update the texture with the contents of the image.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));

        const image = new Image();
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                image
            );
        };
        image.src = url;

        return texture;
    }
}