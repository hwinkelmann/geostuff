import { useEffect, useMemo, useRef, useState } from "react";
import "./WebMap.css";
import { loadTexture, resizeCanvasToDisplaySize } from "./rendering/Utils";
import { RenderContext } from "./rendering/RenderContext";
import { DoubleMatrix } from "./geometry/DoubleMatrix";
import { DoubleVector3 } from "./geometry/DoubleVector3";

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

    const [texture, setTexture]= useState<WebGLTexture | null>(null);

    useEffect(() => {
        if (!context)
            return;

        loadTexture(context, "http://localhost:5173/tex0.png").then(setTexture);
    }, [context]);

    if (context && texture)
        drawScene(context);

    return <canvas className="webmap" ref={canvasRef}>
        hello from webmap
    </canvas>;


    function drawScene(context: RenderContext) {
        resizeCanvasToDisplaySize(context.canvas);

        // const desc = new TileDescriptor(8565, 5677, 14);
        // const tile = new Tile(context, desc, desc);

        context.clear();

        const fov = 50;
        const aspect = context.canvas.width / context.canvas.height;
        const proj = DoubleMatrix.getProjectionMatrixRH(fov, aspect, 1, 100);

        const lookat = DoubleMatrix.getLookAtMatrixRH(new DoubleVector3(-1, 0, 1),
            new DoubleVector3(0, 0, 0), new DoubleVector3(0, 1, 0));
        const worldViewProjectionMatrix = lookat.multiply(proj);//.multiply(translation);

        context.renderTile(texture!, worldViewProjectionMatrix);
    }
}