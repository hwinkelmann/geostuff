import { RenderContext } from "./RenderContext";
import { resizeCanvasToDisplaySize } from "./Utils";

export class Scene {
    constructor(private context: RenderContext) {
    }

    public render() {
        resizeCanvasToDisplaySize(this.context.canvas);

        // const desc = new TileDescriptor(8565, 5677, 14);
        // const tile = new Tile(context, desc, desc);
    }
}