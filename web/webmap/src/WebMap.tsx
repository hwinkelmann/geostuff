import { useEffect, useRef, useState } from "react";
import "./WebMap.css";
import { loadTexture, resizeCanvasToDisplaySize } from "./rendering/Utils";
import { RenderContext } from "./rendering/RenderContext";
import { DoubleMatrix } from "./geometry/DoubleMatrix";
import { DoubleVector3 } from "./geometry/DoubleVector3";
import { ElevationLayer } from "./layers/dem/ElevationLayer";
import { TileDescriptor } from "./models/TileDescriptor";
import { Coordinate } from "./geography/Coordinate";
import { CoordinateLookAtCamera } from "./scene/CoordinateLookAtCamera";
import { Tile } from "./rendering/Tile";
import { Sphere } from "./rendering/renderables/Sphere";

export function WebMap() {
    // Get a reference to the canvas element, create a webgl context and draw a triangle
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [context, setContext] = useState<RenderContext | null>(null);

    const elevationLayer = new ElevationLayer("/api/elevation/tile?z={z}&x={x}&y={y}&resolution={resolution}", {
        resolution: 256,
    });

    const lookAt = new Coordinate(48.285449, 8.143137, 229);
    const position = new Coordinate(48.286191, 8.207323, 500);

    const camera = new CoordinateLookAtCamera(45, canvasRef, 1, 10000, position, lookAt);

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

    const [texture, setTexture] = useState<WebGLTexture | null>(null);
    const [tile, setTile] = useState<Tile | null>(null);


    const [sphere, setSphere] = useState<Sphere | null>(null);
    useEffect(() => {
        if (!context?.gl)
            return;

        setSphere(new Sphere(context, new DoubleVector3(0, 0, 0), 10, 2));
    }, [context?.gl]);

    useEffect(() => {
        if (!context)
            return;

        loadTexture(context, "/tex0.png").then(setTexture);

        setTile(new Tile(context,
            new TileDescriptor(0, 0, 0),
            new TileDescriptor(0, 0, 0),
        ));
    }, [context]);

    if (context && texture)
        drawScene(context);

    if (tile && context)
        tile.render(context, camera.getCameraPosition(), camera.getCameraMatrix(), camera.getProjectionMatrix());

    return <canvas className="webmap" ref={canvasRef}>
        hello from webmap
    </canvas>;


    function drawScene(context: RenderContext) {
        resizeCanvasToDisplaySize(context.canvas);

        // const desc = new TileDescriptor(8565, 5677, 14);
        // const tile = new Tile(context, desc, desc);

        context.clear();

        camera.update();

        const fov = 50;
        const aspect = context.canvas.width / context.canvas.height;
        const proj = DoubleMatrix.getProjectionMatrixRH(fov, aspect, 1, 100);

        const lookat = DoubleMatrix.getLookAtMatrixRH(new DoubleVector3(-1, 0, 1),
            new DoubleVector3(0, 0, 0), new DoubleVector3(0, 1, 0));
        const worldViewProjectionMatrix = lookat.multiply(proj);//.multiply(translation);

        context.renderTile(texture!, worldViewProjectionMatrix);
    }
}