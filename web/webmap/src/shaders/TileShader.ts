export const vertexShaderSource = `#version 300 es
    in vec3 position;
    in vec2 textureCoord;
    out vec2 vTextureCoordinate;
    out vec4 vPosition;

    uniform mat4 projectionMatrix;
    uniform mat4 viewMatrix;
    uniform mat4 modelMatrix;
    uniform mat4 modelViewProjectionMatrix;

    void main(void) {
        gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);
        vTextureCoordinate = textureCoord;
        vPosition = modelMatrix * vec4(position, 1.0);
    }
`;

export const fragmentShaderSource = `#version 300 es
    precision mediump float;
    
    in vec2 vTextureCoordinate;
    in vec4 vPosition;

    uniform sampler2D uSampler;
    uniform vec3 color;

    uniform vec4 uFogColor;
    uniform float uFogNear;
    uniform float uFogFar;
    
    out vec4 fragColor;

    void main(void) {
        float fogDistance = length(vPosition);
        float fogAmount = smoothstep(uFogNear, uFogFar, fogDistance);

        vec4 color = texture(uSampler, vTextureCoordinate) * vec4(color, 1.0);

        fragColor = mix(color, uFogColor, fogAmount);  
    }
`;