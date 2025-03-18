export const vertexShaderSource = `#version 300 es
    in vec3 position;
    in vec2 textureCoord;
    out vec2 vTextureCoordinate;

    uniform mat4 projectionMatrix;
    uniform mat4 viewMatrix;
    uniform mat4 modelMatrix;
    uniform mat4 modelViewProjectionMatrix;

    void main(void) {
        gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);
        vTextureCoordinate = textureCoord;
    }
`;

export const fragmentShaderSource = `#version 300 es
    precision mediump float;
    
    in vec2 vTextureCoordinate;
    uniform sampler2D uSampler;
    uniform vec3 color;
    
    out vec4 fragColor;

    void main(void) {
        fragColor = texture(uSampler, vTextureCoordinate) * vec4(color, 1.0);
    }
`;