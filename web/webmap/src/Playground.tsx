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
import { Quad } from "./rendering/renderables/Quad";

export function Playground() {
    // Get a reference to the canvas element, create a webgl context and draw a triangle
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [context, setContext] = useState<RenderContext | null>(null);

    const ref = useRef<{
        program?: WebGLProgram,
        cube?: Patch,
        started: number,
        passed: number,
        camera?: CoordinateLookAtCamera,
        animationFrame?: number;
        planes?: Quad[],
    }>({
        started: new Date().getTime(),
        passed: 0,
    });

    useEffect(() => {
        if (!canvasRef.current)
            return;

        if (context)
            context.dispose();

        // TODO: Missing error handling
        const c = new RenderContext(canvasRef.current);
        setContext(c);

        ref.current.camera = new CoordinateLookAtCamera(deg2Rad(90), canvasRef, 0.1, 2800, new Coordinate(-1, 0, 2000), new Coordinate(0, 0, 0), Datum.SmallDebug);

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

    const [moveCamera, setMoveCamera] = useState<boolean>(false);
    const [currentClipPlane, setCurrentClipPlane] = useState<number>(0);

    useEffect(() => {
        ref.current.animationFrame = requestAnimationFrame(() => drawScene(context!));

        return () => {
            cancelAnimationFrame(ref.current.animationFrame ?? 0);
        };
    }, [context, moveCamera, currentClipPlane]);

    return <>
        <canvas ref={canvasRef} className="webmap" />
        <div className="debug">
            <button onClick={() => {
                if (ref.current.planes)
                    ref.current.planes.forEach(p => p.destroy(context!));

                ref.current.planes = ref.current.camera?.clipPlanes.map(p => new Quad(context!, p.normal!, p.point!, 50000, 1000, 0));
            }}>
                Debug
            </button>

            <input type="number" value={currentClipPlane} onChange={e => setCurrentClipPlane(parseInt(e.target.value))} min={0} max={5} />

            <label htmlFor="moveCamera">
                <input id="moveCamera" type="checkbox" checked={moveCamera} onChange={() => {
                    setMoveCamera(state => !state)} 
                }/>Move camera
            </label>
        </div>

    </>;

    function drawScene(context: RenderContext) {
        if (!ref.current || !context)
            return;

        resizeCanvasToDisplaySize(context.canvas);

        context.clear();

        const time = new Date().getTime();
        if (!moveCamera)
            ref.current.started = time;

        const dt = time - ref.current.started;
        ref.current.passed += dt;
        ref.current.started = time;

        // Prepare projection-, model- and view-matrix
        context.gl.useProgram(ref.current.program!);

        ref.current.camera?.setPosition(new Coordinate(0, ref.current.passed / 500, Math.sin(ref.current.passed / 2000) * 500 + 800));
        ref.current.camera?.setLookAt(new Coordinate(90, 0, 6000));
        ref.current.camera?.update();

        // The model's origin is the bounding sphere's center, and we need to
        // calculate the relative position of that to the camera. The usual way
        // to do this is to multiply the model- and view matrix, but that would
        // involve very large numbers (the translation part of the model matrix)
        // which would be multiplied with very small numbers (the rotation part),
        // leading to a loss of precision.
        // To remedy this, we're calculating a "model-to-camera" translation matrix,
        // which is then multiplied by the rotation part of the view matrix.
        const cameraPosition = ref.current.camera!.getCameraPosition();
        const modelPosition = ref.current.cube?.boundingSphere.center;

        const modelToCameraTranslation = DoubleMatrix.getTranslationMatrix(
            modelPosition!.x - cameraPosition!.x,
            modelPosition!.y - cameraPosition!.y,
            modelPosition!.z - cameraPosition!.z
        );

        setMatrices(context, ref.current.program!, {
            projectionMatrix: ref.current.camera?.getProjectionMatrix(),
            modelMatrix: modelToCameraTranslation,
            viewMatrix: ref.current.camera?.getViewMatrix().resetTranslation(),
        });

        setBuffers(context, ref.current.program!, {
            vertexBuffer: ref.current.cube!.vertexBuffer!,
            textureCoordBuffer: ref.current.cube!.textureBuffer!,
            indexBuffer: ref.current.cube?.indexBuffer,
            color: [1, 0, 0],
        });

        context.gl.drawElements(context.gl.TRIANGLES, ref.current.cube!.triCount * 3, context.gl.UNSIGNED_SHORT, 0);

        // Draw clip planes as needed
        setMatrices(context, ref.current.program!, {
            projectionMatrix: ref.current.camera?.getProjectionMatrix(),
            modelMatrix: DoubleMatrix.Identity,
            viewMatrix: ref.current.camera?.getViewMatrix(),
        });

        if (ref.current.planes?.[currentClipPlane] &&
            ref.current.camera?.clipPlanes?.[currentClipPlane]) {
            const plane = ref.current.planes[currentClipPlane];
            setBuffers(context, ref.current.program!, {
                vertexBuffer: plane.vertexBuffer!,
                textureCoordBuffer: Quad!.textureBuffer!,
            });

            context.gl.disable(context.gl.CULL_FACE);
            context.gl.drawArrays(context.gl.TRIANGLES, 0, 2 * 3);
        }

        ref.current.animationFrame = requestAnimationFrame(() => drawScene(context!));

        console.log(ref.current.camera?.isBoundingSphereVisible(ref.current.cube!.boundingSphere));
    }
}