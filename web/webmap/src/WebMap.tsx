import { useEffect, useRef, useState } from "react";
import "./WebMap.css";
import { buildProgram, compileShader, deg2Rad, resizeCanvasToDisplaySize, setBuffers, setMatrices } from "./rendering/Utils";
import { RenderContext } from "./rendering/RenderContext";
import { Coordinate } from "./geography/Coordinate";
import { Datum } from "./geography/Datum";
import { mercatorProjection } from "./geography/MercatorProjection";
import { ElevationLayer } from "./scene/layers/dem/ElevationLayer";
import { TextureLayer } from "./scene/layers/texture/TextureLayer";
import { BingAerialLayer } from "./scene/layers/texture/BingAerialLayer";
import { RenderStats, Scene } from "./rendering/Scene";
import { FirstPersonCamera } from "./scene/FirstPersonCamera";
import { DoubleVector3 } from "./geometry/DoubleVector3";
import { KeyTracker } from "./KeyTracker";
import { Sphere } from "./rendering/renderables/Sphere";
import { fragmentShader, vertexShader } from "./shaders/Gouraud";
import { DoubleMatrix } from "./geometry/DoubleMatrix";
import { AsterLayer } from "./scene/layers/dem/AsterLayer";
import { TileDescriptor } from "./models/TileDescriptor";
import { BoundingSphere } from "./scene/BoundingSphere";
import CopyIcon from "./assets/copy.svg";

export function WebMap() {
    // Get a reference to the canvas element, create a webgl context and draw a triangle
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [stats, setStats] = useState<RenderStats | undefined>(undefined);

    const [context, setContext] = useState<RenderContext | null>(null);

    const ref = useRef<{
        elevationLayer?: ElevationLayer,
        textureLayer?: TextureLayer,
        camera?: FirstPersonCamera,
        scene?: Scene;
        animationFrame?: number;
        keyTracker?: KeyTracker;
        selected?: {
            descriptor: TileDescriptor;
            boundingSphere: BoundingSphere;
            intersection: DoubleVector3;
            coordinate: Coordinate;
        }
    }>({});

    const dbg = useRef<{
        program?: WebGLProgram,
        spheres: Sphere[]
    }>({
        spheres: []
    });

    // const lookAt = new Coordinate(48.285449, 8.143137, 229);
    // const position = new Coordinate(48.286191, 8.207323, 50000);
    // const camera = new CoordinateLookAtCamera(60, canvasRef, 1, 1000000, position, lookAt);

    // Initialize context
    useEffect(() => {
        if (!canvasRef.current)
            return;

        // Update context if exists, otherwise create new context
        if (context)
            context.init(canvasRef.current);
        else
            setContext(new RenderContext(canvasRef.current));
    }, [
        canvasRef.current,
    ]);

    useEffect(() => {
        if (!context)
            return;

        dbg.current.program = buildProgram(context, [
            compileShader(context, vertexShader, context.gl!.VERTEX_SHADER),
            compileShader(context, fragmentShader, context.gl!.FRAGMENT_SHADER),
        ]);
    }, [context]);

    // Initialize WebGL resources
    useEffect(() => {
        if (!context)
            return;

        const textureLayer = new BingAerialLayer(context);
        ref.current.textureLayer = textureLayer;

        const elevationLayer = new AsterLayer(mercatorProjection);
        ref.current.elevationLayer = elevationLayer;

        // ref.current.camera = new CoordinateLookAtCamera(deg2Rad(40), canvasRef, 10, 60000000, new Coordinate(48.286191, 8.207323, 500), new Coordinate(48.285449, 8.143137, 229));
        ref.current.camera = new FirstPersonCamera(deg2Rad(40), canvasRef, 1, 10, 220000);

        // // Hausach
        // ref.current.camera.setPositionByCoordinate(new Coordinate(48.286191, 8.207323, 500));
        // ref.current.camera.setLookAtByCoordinate(new Coordinate(48.285449, 8.143137, 229));

        ref.current.camera.setPositionByCoordinate(new Coordinate(46.80851, 8.71458, 3000));
        ref.current.camera.setLookAtByCoordinate(new Coordinate(46.71054, 8.60752, 830.10));

        ref.current.keyTracker = new KeyTracker(true);

        ref.current.scene = new Scene(
            context,
            Datum.WGS84,
            mercatorProjection,
            textureLayer,
            elevationLayer,
            Math.max(textureLayer.minLevel ?? 1, 1),
            textureLayer.maxLevel ?? 10);

        return () => {
            ref.current.keyTracker?.dispose();
        };

    }, [context]);

    // Kick off render loop
    useEffect(() => {
        if (context)
            ref.current.animationFrame = requestAnimationFrame(() => drawScene(context!));

        return () => {
            cancelAnimationFrame(ref.current.animationFrame ?? 0);
        };
    }, [context]);

    return <>
        <canvas ref={canvasRef} onDoubleClick={selectHandler} className="webmap" />
        <div className="stats">
            {ref.current.selected && <table style={{ width: "200px" }}>
                <tbody>
                    <tr>
                        <th colSpan={2}>Selected Tile</th>
                    </tr>
                    <tr>
                        <td colSpan={2}>
                            <img title="copy descriptor" className="copyIcon" src={CopyIcon} onClick={copyToClipboard(ref.current.selected.descriptor.toString())} />
                            {ref.current.selected.descriptor.toString()}
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={2}>
                            <img title="copy coordinate" className="copyIcon" src={CopyIcon} onClick={copyToClipboard(ref.current.selected.coordinate.toGoogleString())} />
                            {ref.current.selected.coordinate.toStringWithElevation()}
                        </td>
                    </tr>
                </tbody>
            </table>}

            <table>
                <tbody>
                    <tr>
                        <th colSpan={2}>Models</th>
                    </tr>

                    <tr>
                        <td>Cached</td>
                        <td>{stats?.models?.cached}</td>
                    </tr>

                    <tr>
                        <td>Rendered</td>
                        <td>{stats?.models?.rendered}</td>
                    </tr>

                </tbody>
            </table>

            {stats?.texture !== undefined && <table>
                <tbody>

                    <tr>
                        <th colSpan={2}>Texture Layer</th>
                    </tr>

                    <tr>
                        <td>Cached</td>
                        <td>{stats?.texture?.size}</td>
                    </tr>

                    <tr>
                        <td>Referenced</td>
                        <td>{stats?.texture?.referenced}</td>
                    </tr>

                    <tr>
                        <td>Queued</td>
                        <td>{stats?.texture?.queued}</td>
                    </tr>

                    <tr>
                        <td>Loading</td>
                        <td>{stats?.texture?.loading}</td>
                    </tr>
                </tbody>
            </table>}


            {stats?.elevation !== undefined && <table>
                <tbody>

                    <tr>
                        <th colSpan={2}>Elevation Layer</th>
                    </tr>

                    <tr>
                        <td>Cached</td>
                        <td>{stats?.elevation?.size}</td>
                    </tr>

                    <tr>
                        <td>Referenced</td>
                        <td>{stats?.elevation?.referenced}</td>
                    </tr>

                    <tr>
                        <td>Queued</td>
                        <td>{stats?.elevation?.queued}</td>
                    </tr>

                    <tr>
                        <td>Loading</td>
                        <td>{stats?.elevation?.loading}</td>
                    </tr>

                </tbody>
            </table>}
        </div>
    </>;

    function drawScene(context: RenderContext) {
        if (!ref.current || !context || !context.gl)
            return;

        // ref.current.camera?.setPosition(new Coordinate(48.241844, 8.214755, 5000000));
        // ref.current.camera?.setLookAt(new Coordinate(48.141844, 8.214755));
        // ref.current.camera?.setPositionByCoordinate(new Coordinate(0, 0, 6000000));
        // ref.current.camera?.setLookAtByCoordinate(new Coordinate(0.1, 0, 0));

        const kt = ref.current.keyTracker!;
        const y = (kt.isKeyDown("w") ? -1 : 0) + (kt.isKeyDown("s") ? 1 : 0);
        const x = (kt.isKeyDown("d") ? 1 : 0) + (kt.isKeyDown("a") ? -1 : 0);

        const ecefPosition = ref.current.camera!.position;
        const latLon = Datum.WGS84.fromCarthesian(ecefPosition);

        const speed = Math.max(10, (latLon.elevation ?? 10) / 300);

        ref.current.camera?.move(new DoubleVector3(x, 0, y).multiply(speed));
        const delta = kt.getDragDelta();
        ref.current.camera?.rotate(delta.x * -0.0005, delta.y * -0.0005);

        ref.current.camera?.setNearFar(Datum.WGS84);

        ref.current.camera?.update();

        resizeCanvasToDisplaySize(context.canvas);
        context.clear();

        setStats(ref.current.scene?.render(ref.current.camera!));

        renderDebugSpheres(context);

        ref.current.animationFrame = requestAnimationFrame(() => drawScene(context!));
    }

    function renderDebugSpheres(context: RenderContext) {
        if (!context || !context.gl || !dbg.current.program || !dbg.current.spheres.length)
            return;

        context.gl.useProgram(dbg.current.program);

        for (const sphere of dbg.current.spheres) {
            setBuffers(context, dbg.current.program, {
                vertexBuffer: sphere.vertexBuffer,
                indexBuffer: sphere.indexBuffer,
                colorBuffer: sphere.colorBuffer,
            });

            setMatrices(context, dbg.current.program, {
                projectionMatrix: ref.current.camera?.getProjectionMatrix(),
                modelMatrix: DoubleMatrix.Identity,
                viewMatrix: ref.current.camera?.getViewMatrix(),
            });

            context.gl.drawElements(context.gl.TRIANGLES, sphere.numTriangles * 3, context.gl.UNSIGNED_SHORT, 0);
        }

    }

    function selectHandler(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
        if (!ref.current || !context || !context.gl)
            return;

        const { x, y } = getScreenCoordinates(e);
        const ray = ref.current.camera?.getRayForPixel(x, y);
        if (!ray)
            return;

        const intersection = ref.current.scene?.getIntersection(ray);
        if (!intersection) {
            ref.current.selected = undefined;
            return;
        }

        ref.current.selected = {
            descriptor: intersection.model.descriptor,
            boundingSphere: intersection.model.boundingSphere,
            intersection: intersection.intersection,
            coordinate: Datum.WGS84.fromCarthesian(intersection.intersection),
        };

        const isSelected = intersection.model.color[0] > 1;
        if (isSelected)
            intersection.model.color = [1, 1, 1];
        else
            intersection.model.color = [1.5, 1.5, 1.5];
    }

    // function onMouseDown(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    //     if (!ref.current || !context || !context.gl)
    //         return;

    //     const { x, y } = getScreenCoordinates(e);

    //     const ray = ref.current.camera?.getRayForPixel(x, y);
    //     if (!ray)
    //         return;

    //     const pt = ray.getPointAt(3000);

    //     const sphere = new Sphere(context, pt, 100);
    //     dbg.current.spheres.push(sphere);

    //     console.log("pushed sphere", ray.direction.x.toFixed(4), ray.direction.y.toFixed(4), ray.direction.z.toFixed(4));
    // }

    function getScreenCoordinates(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
        const rect = canvasRef.current?.getBoundingClientRect();
        const scaleX = canvasRef.current?.width! / rect!.width;
        const scaleY = canvasRef.current?.height! / rect!.height;
        const x = (e.clientX - rect!.left) * scaleX;
        const y = (e.clientY - rect!.top) * scaleY;

        return { x, y };
    }

    function copyToClipboard(text: string) {
        return () => {
            navigator.clipboard.writeText(text);
        };
    }
}