import { BoundingBox } from "../geography/BoundingBox";
import { Datum } from "../geography/Datum";
import { Projection } from "../geography/Projection";
import { TileDescriptor } from "../models/TileDescriptor";
import { BoundingSphere } from "./BoundingSphere";
import { Camera } from "./Camera";

export class Lod {
    constructor(private datum: Datum, private projection: Projection, private minLevel: number, private maxLevel: number) {
    }

    public performLevelOfDetail(camera: Camera): TileDescriptor[] {
        const result: TileDescriptor[] = [];

        this.performLevelOfDetailRecursive(camera, result, new TileDescriptor(0, 0, 0));


        return result;
    }

    private performLevelOfDetailRecursive(camera: Camera, result: TileDescriptor[], desc: TileDescriptor) {
        // If the tile is not visible, we can stop here
        const boundingSphere = this.getApproximateBoundingSphere(desc);
        if (!camera.isBoundingSphereVisible(boundingSphere)) {
            console.log("bounding sphere invisible", boundingSphere)
            return;
        }

        // Check how big the tile is on the screen
        const logicalScreenSize = this.getLogicalScreenSize(camera, desc, desc.getBounds(this.projection), boundingSphere);

        if (desc.zoom >= this.minLevel &&
            (logicalScreenSize < 2 || desc.zoom >= this.maxLevel)) {
            // If tile resolution is OK or we're at the maximum level, we're done.
            // Also, we need to be at least at the minimum level
            console.log("pushierung von ", desc)
            result.push(desc);
            return;
        }

        // Otherwise: Refine!
        this.performLevelOfDetailRecursive(camera, result, new TileDescriptor(desc.zoom + 1, desc.x * 2, desc.y * 2));
        this.performLevelOfDetailRecursive(camera, result, new TileDescriptor(desc.zoom + 1, desc.x * 2 + 1, desc.y * 2));
        this.performLevelOfDetailRecursive(camera, result, new TileDescriptor(desc.zoom + 1, desc.x * 2, desc.y * 2 + 1));
        this.performLevelOfDetailRecursive(camera, result, new TileDescriptor(desc.zoom + 1, desc.x * 2 + 1, desc.y * 2 + 1));


    }

    private getLogicalScreenSize(camera: Camera, desc: TileDescriptor, boundingBox: BoundingBox, boundingSphere: BoundingSphere): number {
        // Approximation for tile width in meters
        const tileMeters = (this.datum.meridianLength / desc.tileStride) * Math.cos(boundingBox.centerCoordinate.latitude * Math.PI / 180.0);

        // Calculate distance between camera and tile
        const distCameraVolume = Math.max(
            boundingSphere.center.distanceTo(camera.position) - boundingSphere.radius / 2,
            0.1
        );

        // Project tile width
        const matrix = camera.projectionMatrix;
        const x = matrix.M11 * tileMeters + matrix.M31 * distCameraVolume + matrix.M41;
        const w = matrix.M14 * tileMeters - matrix.M34 * distCameraVolume + matrix.M44;

        console.log("Tile meters: " + tileMeters + ", distCameraVolume: " + distCameraVolume + ", x: " + x + ", w: " + w);

        return w > 0 ? x / w : 0;
    }

    private getApproximateBoundingSphere(desc: TileDescriptor): BoundingSphere {
        const boundingBox = desc.getBounds(this.projection);

        console.log(boundingBox)

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