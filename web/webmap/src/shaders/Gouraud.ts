export const vertexShader = `
    attribute vec3 position;
    attribute vec3 color;

    uniform mat4 projectionMatrix;
    uniform mat4 viewMatrix;
    uniform mat4 modelMatrix;
    uniform mat4 modelViewProjectionMatrix;

    varying vec3 vColor;

    void main(void) {
        gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);
        vColor = color;
    }
`;

export const fragmentShader = `
    precision mediump float;
    varying vec3 vColor;

    void main(void) {
        gl_FragColor = vec4(vColor, 1.0);
    }
`;