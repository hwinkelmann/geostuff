export const vertexShader = `#version 300 es
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


export const fragmentShader = `#version 300 es
    precision mediump float;
    in vec2 vTextureCoordinate;
    out vec4 fragColor;

    vec3 colors[6] = vec3[](
        vec3(1.0, 0.0, 0.0),
        vec3(0.0, 1.0, 0.0),
        vec3(0.0, 0.0, 1.0),
        vec3(1.0, 1.0, 0.0),
        vec3(0.0, 1.0, 1.0),
        vec3(1.0, 0.0, 1.0)
    );

    void main(void) {
        int x = int(vTextureCoordinate.x);
        int y = int(vTextureCoordinate.y);

        int index = x + y * 3;

        fragColor = vec4(colors[index % 6], 1.0);
    }
`;