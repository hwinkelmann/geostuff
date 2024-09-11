import { useEffect, useRef, useState } from "react";
import "./WebMap.css";
import { Tile } from "./rendering/Tile";
import { TileDescriptor } from "./models/TileDescriptor";
import { resizeCanvasToDisplaySize } from "./rendering/Utils";
import { RenderContext } from "./rendering/RenderContext";

export function WebMap() {
    // Get a reference to the canvas element, create a webgl context and draw a triangle
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [context, setContext] = useState<RenderContext | null>(null);
    
    useEffect(() => {
        if (!canvasRef.current)
            return;

        if (context)
            context.dispose();

        // TODO: Missing error handling
        setContext(new RenderContext(canvasRef.current));
    }, [
        canvasRef.current,
    ]);

    return <canvas className="webmap" ref={canvasRef}>
        hello from webmap
    </canvas>
}

function drawScene(context: RenderContext) {
    resizeCanvasToDisplaySize(context.canvas);

    const tile = new Tile(context, new TileDescriptor(8565, 5677, 14));


    context.gl.clearColor(0.5, 0.5, 0.5, 1.0);
    context.gl.clear(context.gl.COLOR_BUFFER_BIT | context.gl.DEPTH_BUFFER_BIT);

    const vertexShaderSource = `
        attribute vec4 position;
        void main() {
            gl_Position = position;
        }
    `;

    const fragmentShaderSource = `
        void main() {
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
    `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) {
        console.error("Could not create vertex shader");
        return;
    }

    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error("Could not compile vertex shader:", gl.getShaderInfoLog(vertexShader));
        return;
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragmentShader) {
        console.error("Could not create fragment shader");
        return;
    }

    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error("Could not compile fragment shader:", gl.getShaderInfoLog(fragmentShader));
        return;
    }

    const program = gl.createProgram();
    if (!program) {
        console.error("Could not create program");
        return;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Could not link program:", gl.getProgramInfoLog(program));
        return;
    }

    gl.useProgram(program);

    const positionAttributeLocation = gl.getAttribLocation(program, "position");
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
        0, 0,
        0, 0.5,
        0.7, 0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

}