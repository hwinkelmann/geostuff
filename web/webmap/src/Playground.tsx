import { useEffect, useRef, useState } from "react";
import { RenderContext } from "./rendering/RenderContext";
import { buildProgram, compileShader, deg2Rad, resizeCanvasToDisplaySize, setBuffers, setMatrices } from "./rendering/Utils";
import { DoubleMatrix } from "./geometry/DoubleMatrix";
import { fragmentShader, vertexShader } from "./shaders/TileDebug";
import "./WebMap.css";
import { Patch } from "./rendering/renderables/Patch";
import { CoordinateLookAtCamera } from "./scene/CoordinateLookAtCamera";
import { Coordinate } from "./geography/Coordinate";
import { Datum } from "./geography/Datum";

export function Playground() {
    // Get a reference to the canvas element, create a webgl context and draw a triangle
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [context, setContext] = useState<RenderContext | null>(null);

    const ref = useRef<{
        program?: WebGLProgram,
        cube?: Patch,
        started: number,
        camera?: CoordinateLookAtCamera,
        animationFrame?: number;
    }>({
        started: new Date().getTime(),
    });

    useEffect(() => {
        if (!canvasRef.current)
            return;

        if (context)
            context.dispose();

        // TODO: Missing error handling
        const c = new RenderContext(canvasRef.current);
        setContext(c);

        ref.current.camera = new CoordinateLookAtCamera(deg2Rad(90), canvasRef, 0.1, 8000, new Coordinate(-1, 0, 2000), new Coordinate(0, 0, 0), Datum.SmallDebug);

        ref.current.program = buildProgram(c, [
            compileShader(c, vertexShader, c.gl.VERTEX_SHADER),
            compileShader(c, fragmentShader, c.gl.FRAGMENT_SHADER),
        ]);

        ref.current.cube = new Patch(c);

        setBuffers(c, ref.current.program!, {
            vertexBuffer: ref.current.cube!.vertexBuffer!,
            textureCoordBuffer: ref.current.cube!.textureBuffer!,
            indexBuffer: ref.current.cube?.indexBuffer,
            color: [1, 0, 0],
        });
    }, [
        canvasRef.current,
    ]);

    useEffect(() => {
        ref.current.animationFrame = requestAnimationFrame(() => drawScene(context!));

        return () => {
            cancelAnimationFrame(ref.current.animationFrame ?? 0);
        };
    }, [context]);

    return <canvas ref={canvasRef} className="webmap" />;

    function drawScene(context: RenderContext) {
        if (!ref.current || !context)
            return;

        resizeCanvasToDisplaySize(context.canvas);

        context.clear();

        const dt = new Date().getTime() - ref.current.started;

        // Prepare projection-, model- and view-matrix
        context.gl.useProgram(ref.current.program!);

        // ref.current.camera?.setPosition(new Coordinate(0, dt / 100, 700));
        ref.current.camera?.setPosition(new Coordinate(0, dt/100, 700));
        ref.current.camera?.setLookAt(new Coordinate(90, 0, 0));
        ref.current.camera?.update();

        setMatrices(context, ref.current.program!, {
            projectionMatrix: ref.current.camera?.getProjectionMatrix(),
            modelMatrix: DoubleMatrix.Identity,
            viewMatrix: ref.current.camera?.getCameraMatrix(),
        });

        // setBuffers(context, ref.current.program!, {
        //     vertexBuffer: ref.current.cube!.vertexBuffer!,
        //     textureCoordBuffer: ref.current.cube!.textureBuffer!,
        //     indexBuffer: ref.current.cube?.indexBuffer,
        //     color: [1, 0, 0],
        // });

        context.gl.drawElements(context.gl.TRIANGLES, ref.current.cube!.triCount * 3, context.gl.UNSIGNED_SHORT, 0);
        ref.current.animationFrame = requestAnimationFrame(() => drawScene(context!));
    }
}