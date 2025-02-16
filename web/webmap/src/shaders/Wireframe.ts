export const vertexShader = `#version 300 es
    in vec3 position;
    out vec3 vBarycentric;

    uniform mat4 projectionMatrix;
    uniform mat4 viewMatrix;
    uniform mat4 modelMatrix;
    uniform mat4 modelViewProjectionMatrix;

    void main(void) {
        gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);

        // Assign barycentric coordinates for wireframe rendering
        if (gl_VertexID % 3 == 0) {
            vBarycentric = vec3(1, 0, 0);
        } else 
            if (gl_VertexID % 3 == 1) {
                vBarycentric = vec3(0, 1, 0);
            } else {
                if (gl_VertexID % 3 == 2)
                    vBarycentric = vec3(0, 0, 1);
            }
    }
`;

export const fragmentShader = `#version 300 es
    precision mediump float;
    in vec3 vBarycentric;
    out vec4 fragColor;

    uniform vec3 color;

    void main(void) {
        float minBarycentric = min(vBarycentric.x, min(vBarycentric.y, vBarycentric.z));
        if (minBarycentric < 0.02) {
            fragColor = vec4(color, 1.0); // Wireframe color
        } else {
            discard; // Discard the fragment to create the wireframe effect
        }
    }
`;