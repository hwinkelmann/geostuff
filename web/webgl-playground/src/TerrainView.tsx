import React, { useEffect, useRef } from "react";
import { TerrainRenderer } from "./terrain/TerrainRenderer";

export function TerrainView() {
    const container = useRef<HTMLDivElement>(null);

    const instance = useRef<TerrainRenderer | undefined>();

    useEffect(() => {
        if (!container.current)
            return;

        if (instance.current)
            instance.current.destroy();

        instance.current = new TerrainRenderer(container.current);
    }, []);

    const observerRef = useRef(new ResizeObserver(e => {
        window.requestAnimationFrame(() => {
            instance.current?.render();
        });
    }));

    // Initialization and cleanup
    useEffect(() => {
        const c = observerRef.current;
        if (container.current)
            observerRef.current.observe(container.current);

        return () => {
            if (c)
                c.disconnect();
        };
    }, [
        container,
        observerRef,
    ]);


    return <div style={{
        position: "absolute",
        inset: 0,
    }}
        ref={container} />;
}