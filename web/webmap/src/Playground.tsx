import { useEffect, useRef, useState } from "react";
import { RenderContext } from "./rendering/RenderContext";
import { buildProgram, compileShader, deg2Rad, resizeCanvasToDisplaySize, setBuffers, setMatrices } from "./rendering/Utils";
import { DoubleMatrix } from "./geometry/DoubleMatrix";
import { fragmentShader, vertexShader } from "./shaders/TileDebug";
import { vertexShader as gouraudVertexShader, fragmentShader as gouraudFragmentShader } from "./shaders/Gouraud";
import "./WebMap.css";
import { Datum } from "./geography/Datum";
import { Lod } from "./scene/Lod";
import { MercatorProjection } from "./geography/MercatorProjection";
import { TileDescriptor } from "./models/TileDescriptor";
import { TileModel } from "./rendering/renderables/TileModel";
import { Sphere } from "./rendering/renderables/Sphere";
import { DoubleVector3 } from "./geometry/DoubleVector3";
import { FirstPersonCamera } from "./scene/FirstPersonCamera";
import { KeyTracker } from "./KeyTracker";
import { Frustum } from "./rendering/renderables/Frustum";
import { BoundingSphere } from "./scene/BoundingSphere";

export function Playground() {
    // Get a reference to the canvas element, create a webgl context and draw a triangle
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [context, setContext] = useState<RenderContext | null>(null);

    const lod = new Lod(Datum.WGS84, new MercatorProjection());

    const ref = useRef<{
        program?: WebGLProgram,
        gouruadProgram?: WebGLProgram,
        cube?: TileModel,

        spheres?: Sphere[],
        started: number,
        passed: number,
        camera?: FirstPersonCamera,
        animationFrame?: number;
        keyTracker?: KeyTracker;
        gouraudProgram?: WebGLProgram;
        frustum?: Frustum;
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

        // ref.current.camera = new CoordinateLookAtCamera(deg2Rad(90), canvasRef, 1, 280000, new Coordinate(-1, 0, 200), new Coordinate(0, 0, 0), Datum.WGS84);
        ref.current.camera = new FirstPersonCamera(deg2Rad(40), canvasRef, 1, 1, 280000);

        ref.current.gouraudProgram = buildProgram(c, [
            compileShader(c, gouraudVertexShader, c.gl!.VERTEX_SHADER),
            compileShader(c, gouraudFragmentShader, c.gl!.FRAGMENT_SHADER),
        ]);

        ref.current.program = buildProgram(c, [
            compileShader(c, vertexShader, c.gl!.VERTEX_SHADER),
            compileShader(c, fragmentShader, c.gl!.FRAGMENT_SHADER),
        ]);

        const d = new TileDescriptor(0, 0, 0);

        ref.current.keyTracker = new KeyTracker(true);

        for (let i = 0; i < 10000; i++) {
            const s = new Sphere(c, new DoubleVector3(Math.random() * 1000 - 500, Math.random() * 1000 - 500, Math.random() * 1000 - 500), 10, 10);
            ref.current.spheres = ref.current.spheres ?? [];
            ref.current.spheres.push(s);
        }

        ref.current.cube = new TileModel(c, d, d, undefined, 48, Datum.WGS84, new MercatorProjection());

        setBuffers(c, ref.current.program!, {
            vertexBuffer: ref.current.cube!.vertexBuffer!,
            textureCoordBuffer: ref.current.cube!.textureBuffer!,
            indexBuffer: ref.current.cube?.indexBuffer,
            color: [1, 0, 0],
        });
    }, [
        canvasRef.current,
    ]);

    const [numSpheres, setNumSpheres] = useState<number>(1);

    useEffect(() => {
        ref.current.animationFrame = requestAnimationFrame(() => drawScene(context!));

        return () => {
            cancelAnimationFrame(ref.current.animationFrame ?? 0);
        };
    }, [context]);

    return <>
        <canvas ref={canvasRef} className="webmap" />
        <div className="debug">
            <button onClick={() => {
                const lod = new Lod(Datum.WGS84, new MercatorProjection());
                // console.log(lod.performLevelOfDetail(ref.current.camera!, 0, 5));
            }}>
                Perform LOD
            </button>
            <button onClick={() => {
                if (ref.current.frustum)
                    ref.current.frustum.destroy(context!);

                ref.current.frustum = new Frustum(context!, ref.current.camera!);
                // if (ref.current.planes)
                //     ref.current.planes.forEach(p => p.destroy(context!));

                // ref.current.planes = ref.current.camera?.clipPlanes.map(p => new Quad(context!, p.normal!, p.point!, 50000, 1000, 0));
            }}>
                Calculate Clip Planes
            </button>

            <input type="number" value={numSpheres} onChange={e => setNumSpheres(parseInt(e.target.value))} min={0} max={10000} />
        </div>

    </>;

    function drawScene(context: RenderContext) {
        if (!ref.current || !context)
            return;

        resizeCanvasToDisplaySize(context.canvas);

        context.clear();

        const time = new Date().getTime();

        const dt = time - ref.current.started;
        ref.current.passed += dt;
        ref.current.started = time;

        // Prepare projection-, model- and view-matrix

        const kt = ref.current.keyTracker!;
        const y = (kt.isKeyDown("w") ? -1 : 0) + (kt.isKeyDown("s") ? 1 : 0);
        const x = (kt.isKeyDown("d") ? 1 : 0) + (kt.isKeyDown("a") ? -1 : 0);
        const z = (kt.isKeyDown("q") ? 1 : 0) + (kt.isKeyDown("e") ? -1 : 0);
        const speed = 10;
        ref.current.camera?.move(new DoubleVector3(x, z, y).multiply(speed));
        const delta = kt.getDragDelta();

        ref.current.camera?.rotate(delta.x * -0.0005, delta.y * -0.0005, 0);

        ref.current.camera?.update();

        // setMatrices(context, ref.current.program!, {
        //     projectionMatrix: ref.current.camera?.getProjectionMatrix(),
        //     modelMatrix: DoubleMatrix.Identity,
        //     viewMatrix: ref.current.camera?.getViewMatrix(),
        // });

        // setBuffers(context, ref.current.program!, {
        //     vertexBuffer: ref.current.cube!.vertexBuffer!,
        //     textureCoordBuffer: ref.current.cube!.textureBuffer!,
        //     indexBuffer: ref.current.cube?.indexBuffer,
        //     color: [1, 0, 0],
        // });

        // context.gl?.drawElements(context.gl.TRIANGLES, ref.current.cube!.triCount * 3, context.gl.UNSIGNED_SHORT, 0);


        // Draw frustum
        if (ref.current.frustum) {
            context.gl?.useProgram(ref.current.gouraudProgram!);
            setMatrices(context, ref.current.gouraudProgram!, {
                projectionMatrix: ref.current.camera?.getProjectionMatrix(),
                modelMatrix: DoubleMatrix.Identity,
                viewMatrix: ref.current.camera?.getViewMatrix(),
            });

            ref.current.frustum.render(context, ref.current.gouraudProgram!);
        }

        ref.current.animationFrame = requestAnimationFrame(() => drawScene(context!));

        context.gl?.useProgram(ref.current.gouraudProgram!);
        setMatrices(context, ref.current.gouraudProgram!, {
            projectionMatrix: ref.current.camera?.getProjectionMatrix(),
            // modelMatrix: modelToCameraTranslation,
            modelMatrix: DoubleMatrix.Identity,
            viewMatrix: ref.current.camera?.getViewMatrix(), //.resetTranslation(),
        });

        const spheres = ref.current.spheres ?? [];
        let numVisible = 0;
        let numInvisible = 0;
        for (let i = 0; i < Math.min(numSpheres, spheres.length); i++) {
            const s = spheres[i];
            const isVisible = ref.current.camera?.isBoundingSphereVisible(
                new BoundingSphere(s.position, s.radius),
            );
            setBuffers(context, ref.current.gouraudProgram!, {
                vertexBuffer: s.vertexBuffer,
                indexBuffer: s?.indexBuffer,
                colorBuffer: s.colorBuffer,
            });

            if (isVisible)
                numVisible++;
            else
                numInvisible++;
            
            context.gl?.drawElements(context.gl.TRIANGLES, s.numTriangles * 3, context.gl.UNSIGNED_SHORT, 0);
        }

        console.log(`Visible: ${numVisible}, Invisible: ${numInvisible}`);
    }
}