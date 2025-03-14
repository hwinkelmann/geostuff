import { useEffect, useRef, useState } from "react";
import "./WebMap.css";
import { buildProgram, compileShader, deg2Rad, resizeCanvasToDisplaySize } from "./rendering/Utils";
import { RenderContext } from "./rendering/RenderContext";
import { Coordinate } from "./geography/Coordinate";
import { Datum } from "./geography/Datum";
import { mercatorProjection } from "./geography/MercatorProjection";
import { ElevationLayer } from "./scene/layers/dem/ElevationLayer";
import { TextureLayer } from "./scene/layers/texture/TextureLayer";
import { BingAerialLayer } from "./scene/layers/texture/BingAerialLayer";
import { Scene } from "./rendering/Scene";
import { FirstPersonCamera } from "./scene/FirstPersonCamera";
import { DoubleVector3 } from "./geometry/DoubleVector3";
import { KeyTracker } from "./KeyTracker";
import { Sphere } from "./rendering/renderables/Sphere";
import { fragmentShader, vertexShader } from "./shaders/Gouraud";

export function WebMap() {
    // Get a reference to the canvas element, create a webgl context and draw a triangle
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [context, setContext] = useState<RenderContext | null>(null);

    const ref = useRef<{
        elevationLayer?: ElevationLayer,
        textureLayer?: TextureLayer,
        camera?: FirstPersonCamera,
        scene?: Scene;
        animationFrame?: number;
        keyTracker?: KeyTracker;
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

        // ref.current.camera = new CoordinateLookAtCamera(deg2Rad(40), canvasRef, 10, 60000000, new Coordinate(48.286191, 8.207323, 500), new Coordinate(48.285449, 8.143137, 229));
        ref.current.camera = new FirstPersonCamera(deg2Rad(40), canvasRef, 1, 1000, 20000000);

        ref.current.camera.setPositionByCoordinate(new Coordinate(0, 0, 600000));
        ref.current.camera.setLookAtByCoordinate(new Coordinate(0.1, 0, 0));

        // ref.current.camera?.setPosition(new Coordinate(0, 0, 6000000));
        // ref.current.camera?.setLookAt(new Coordinate(0.1, 0, 0));

        ref.current.keyTracker = new KeyTracker(true);

        ref.current.scene = new Scene(
            context,
            Datum.WGS84,
            mercatorProjection,
            textureLayer,
            undefined,
            Math.max(textureLayer.minLevel ?? 2, 2),
            textureLayer.maxLevel ?? 10,
            128)
        // ref.current.elevationLayer = new ElevationLayer(context!);

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

    return <canvas ref={canvasRef} className="webmap" />;

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
        
        const speed = 100000;
        ref.current.camera?.move(new DoubleVector3(x, 0, y).multiply(speed));
        const delta = kt.getDragDelta();
        ref.current.camera?.rotate(delta.x * -0.0005, delta.y * -0.0005, 0);

        ref.current.camera?.update();

        resizeCanvasToDisplaySize(context.canvas);
        context.clear();

        ref.current.scene?.render(ref.current.camera!);

        ref.current.animationFrame = requestAnimationFrame(() => drawScene(context!));
    }
}