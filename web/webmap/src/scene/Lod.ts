import { BoundingBox } from "../geography/BoundingBox";
import { Datum } from "../geography/Datum";
import { Projection } from "../geography/Projection";
import { DoubleVector3 } from "../geometry/DoubleVector3";
import { TileDescriptor } from "../models/TileDescriptor";
import { RenderContext } from "../rendering/RenderContext";
import { deg2Rad } from "../rendering/Utils";
import { BoundingSphere } from "./BoundingSphere";
import { Camera } from "./Camera";

export type LodDetails = {
    desc: TileDescriptor;
    boundingSphere: BoundingSphere;
    logicalScreenSize: number;
};

export class Lod {
    constructor(private datum: Datum, private projection: Projection) {
    }

    public performLevelOfDetail(context: RenderContext, camera: Camera, minLevel: number, maxLevel: number): LodDetails[] {
        const result: LodDetails[] = [];
        this.performLevelOfDetailRecursive(context, camera, result, new TileDescriptor(0, 0, 0), minLevel, maxLevel);

        return result;
    }

    private performLevelOfDetailRecursive(context: RenderContext, camera: Camera, result: LodDetails[], desc: TileDescriptor, minLevel: number, maxLevel: number) {
        // If the tile is not visible, we can stop here
        const boundingSphere = this.getApproximateBoundingSphere(desc);
        if (!camera.isBoundingSphereVisible(boundingSphere)) {
            return;
        }

        // Check how big the tile is on the screen
        const logicalScreenSize = this.getTileScreenSize(context, camera, desc, desc.getBounds(this.projection), boundingSphere);

        if (desc.zoom >= minLevel && logicalScreenSize < 2048) {
            // If tile resolution is OK or we're at the maximum level, we're done.
            // Also, we need to be at least at the minimum level
            result.push({
                desc,
                logicalScreenSize,
                boundingSphere,
            });
            return;
        }

        // Otherwise: Refine!
        const x = desc.x * 2;
        const y = desc.y * 2;
        const zoom = desc.zoom + 1;
        this.performLevelOfDetailRecursive(context, camera, result, new TileDescriptor(x, y, zoom), minLevel, maxLevel);
        this.performLevelOfDetailRecursive(context, camera, result, new TileDescriptor(x + 1, y, zoom), minLevel, maxLevel);
        this.performLevelOfDetailRecursive(context, camera, result, new TileDescriptor(x, y + 1, zoom), minLevel, maxLevel);
        this.performLevelOfDetailRecursive(context, camera, result, new TileDescriptor(x + 1, y + 1, zoom), minLevel, maxLevel);
    }

    private getTileScreenSize(context: RenderContext, camera: Camera, desc: TileDescriptor, boundingBox: BoundingBox, boundingSphere: BoundingSphere): number {
        // Approximation for tile width in meters
        const tileMeters = (this.datum.meridianLength / desc.tileStride) * Math.cos(deg2Rad(boundingBox.centerCoordinate.latitude));

        // Calculate distance between camera and tile
        const distCameraVolume = Math.max(
            boundingSphere.center.distanceTo(camera.position) - boundingSphere.radius,
            0.1
        );

        // Calculate the width of the tile in screen space
        const matrix = camera.projectionMatrix;
        const pt = new DoubleVector3(tileMeters, 0, -distCameraVolume);
        const pixels = pt.transform(matrix).x * context.canvas.width / 2;
        
        return pixels;
    }

    private getApproximateBoundingSphere(desc: TileDescriptor): BoundingSphere {
        const boundingBox = desc.getBounds(this.projection);

        // Get the best approximation of a bounding sphere that we have
        let boundingSphere: BoundingSphere | undefined = undefined;

        // TODO: If the model is already loaded, use it's bounding sphere
        // TODO: If we have elevation data, use that to approximate the bounding sphere
        // TODO: If we have a neighboring tile, use that to approximate the bounding sphere
        // TODO: Adjust boundingBox's elevation to contain min/max elevation. The following
        // code assumes that this happened.
        // We have no idea, so let's guesstimate
        if (!boundingSphere) {
            const center = this.datum.toCarthesian(boundingBox.centerCoordinate);

            const maxDistanceFromCenter = Math.max(
                center.distanceTo(this.datum.toCarthesian(boundingBox.minCoordinate)),
                center.distanceTo(this.datum.toCarthesian(boundingBox.maxCoordinate))
            );

            boundingSphere = new BoundingSphere(center, maxDistanceFromCenter);
        }

        return boundingSphere;
    }
}