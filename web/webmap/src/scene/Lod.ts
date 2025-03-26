import { BoundingBox } from "../geography/BoundingBox";
import { Coordinate } from "../geography/Coordinate";
import { Datum } from "../geography/Datum";
import { Projection } from "../geography/Projection";
import { DoubleVector3 } from "../geometry/DoubleVector3";
import { TileDescriptor } from "../models/TileDescriptor";
import { TileModel } from "../rendering/renderables/TileModel";
import { RenderContext } from "../rendering/RenderContext";
import { deg2Rad } from "../rendering/Utils";
import { GenericCache } from "../utils/GenericCache";
import { BoundingSphere } from "./BoundingSphere";
import { Camera } from "./Camera";
import { ElevationLayer } from "./layers/dem/ElevationLayer";

export type LodDetails = {
    desc: TileDescriptor;
    boundingSphere: BoundingSphere;
    approximatedScreenSize: number;
};

export class Lod {
    constructor(private datum: Datum, private projection: Projection, private elevationLayer?: ElevationLayer) {
    }

    public performLevelOfDetail(context: RenderContext, camera: Camera, minLevel: number, maxLevel: number, modelCache: GenericCache<string, TileModel>): LodDetails[] {
        const result: LodDetails[] = [];
        this.performLevelOfDetailRecursive(context, camera, result, new TileDescriptor(0, 0, 0), minLevel, maxLevel, modelCache);

        return result;
    }

    private performLevelOfDetailRecursive(context: RenderContext, camera: Camera, result: LodDetails[], desc: TileDescriptor, minLevel: number, maxLevel: number, modelCache: GenericCache<string, TileModel>) {
        // If the tile is not visible, we can stop here
        const boundingSphere = this.getApproximateBoundingSphere(desc, modelCache);
        if (!camera.isBoundingSphereVisible(boundingSphere)) {
            return;
        }

        // Check how big the tile is on the screen
        // const approxScreenSize = this.getTileScreenSize(context, camera, desc, desc.getBounds(this.projection), boundingSphere);
        const approxScreenSize = this.approximateBoundingSphereScreenSize(context, camera, desc, desc.getBounds(this.projection), boundingSphere);

        if (approxScreenSize < 360 || desc.zoom === maxLevel) {
            /*
            // perform "back tile culling" for tiles that we can consider "flat enough",
            // meaning, we're close enough to the ground.
            const tileNormal = boundingSphere.center.clone().normalize().transform(camera.viewMatrix.resetTranslation());
            const dot = tileNormal.dot(camera.getViewMatrix().getFrontVector());
            if (dot < -0.8)
                return;
            */

            // If tile resolution is OK or we're at the maximum level, we're done.
            // Also, we need to be at least at the minimum level
            result.push({
                desc,
                approximatedScreenSize: approxScreenSize,
                boundingSphere,
            });
            return;
        }

        // Otherwise: Refine!
        const x = desc.x * 2;
        const y = desc.y * 2;
        const zoom = desc.zoom + 1;

        this.performLevelOfDetailRecursive(context, camera, result, new TileDescriptor(x, y, zoom), minLevel, maxLevel, modelCache);
        this.performLevelOfDetailRecursive(context, camera, result, new TileDescriptor(x + 1, y, zoom), minLevel, maxLevel, modelCache);
        this.performLevelOfDetailRecursive(context, camera, result, new TileDescriptor(x, y + 1, zoom), minLevel, maxLevel, modelCache);
        this.performLevelOfDetailRecursive(context, camera, result, new TileDescriptor(x + 1, y + 1, zoom), minLevel, maxLevel, modelCache);
    }

    /**
     * Approximates the size of a bounding sphere on the screen.
     * @param desc TileDescriptor
     * @param boundingBox Map coordinate bounding box
     * @param boundingSphere Bounding sphere in ECEF coordinates
     * @returns Number of pixels that the bounding sphere would occupy on the screen
     */
    private approximateBoundingSphereScreenSize(context: RenderContext, camera: Camera, desc: TileDescriptor, boundingBox: BoundingBox, boundingSphere: BoundingSphere): number {
        // Calculate distance between camera and bounding sphere center
        // Approximation for tile width in meters
        const tileMeters = (this.datum.meridianLength / desc.tileStride) * Math.cos(deg2Rad(boundingBox.centerCoordinate.latitude));

        // Calculate how the tile is oriented towards the camera. If we are looking at the tile from the side,
        // it is acceptable to reduce it's resolution. 
        const normal = boundingSphere.center.clone().subtract(this.datum.toCarthesian(boundingBox.centerCoordinate)).normalize();
        const camToCenter = boundingSphere.center.clone().subtract(camera.getCameraPosition()).normalize();

        // Calculate dot product between normal and camera to center vector.
        // 1 => We're looking straight at the tile, 0 => We're looking at the tile from the side
        const dot = Math.abs(normal.dot(camToCenter));

        // Biassed dot product, so that we don't reduce resolution too much. This function is applied
        // to the estimated screen size in pixels at the end.
        // This is my bias function: https://www.desmos.com/calculator/l4yosjimwq
        const bias = Math.min(1, 0.5 + dot * dot);

        // Calculate distance between camera and tile
        let distCameraVolume = (boundingSphere.center.clone().subtract(camera.getCameraPosition())).length();

        if (distCameraVolume < 0)
            distCameraVolume = 0.1;

        // Project tile with
        const projected = camera.projectionMatrix.multiplyMatrixVector(new DoubleVector3(
            tileMeters,
            0,
            -distCameraVolume,
        ));

        return (projected.x * context.canvas.clientWidth / 2) * bias;
    }

    private approximationCache = new GenericCache<string, BoundingSphere>(4096);


    public getApproximateBoundingSphere(desc: TileDescriptor, modelCache: GenericCache<string, TileModel>): BoundingSphere {
        const boundingBox = desc.getBounds(this.projection);

        // Get the best approximation of a bounding sphere that we have
        let boundingSphere: BoundingSphere | undefined = undefined;

        // If the model is already loaded, use it's bounding sphere
        if (modelCache.peek(desc.toString()))
            return modelCache.peek(desc.toString())!.boundingSphere;

        // TODO: If we have elevation data, use that to approximate the bounding sphere
        // TODO: If we have a neighboring tile, use that to approximate the bounding sphere
        // TODO: Adjust boundingBox's elevation to contain min/max elevation. The following
        // code assumes that this happened.
        // We have no idea, so let's guesstimate

        // If a parent model is loaded already, use it's elevation
        const parent = desc.getParent();
        if (parent && modelCache.peek(parent.toString())) {
            const parentElevationTile = modelCache.peek(parent.toString())!.elevation?.data;
            boundingBox.minElevation = parentElevationTile?.minElevation ?? boundingBox.minElevation;
            boundingBox.maxElevation = parentElevationTile?.maxElevation ?? boundingBox.maxElevation;
        }

        const bestElevationTile = this.elevationLayer?.getBestAvailableMatch(desc);
        if (bestElevationTile) {
            boundingBox.minElevation = bestElevationTile.data.minElevation - 500;
            boundingBox.maxElevation = bestElevationTile.data.maxElevation + 500;
        }

        const key = boundingBox.toString();
        if (this.approximationCache.peek(key))
            return this.approximationCache.get(key)!;

        const numSamples = 25;
        const points: DoubleVector3[] = [];
        for (let z = 0; z < 2; z++)
            for (let i = 0; i <= numSamples; i++) {
                for (let j = 0; j <= numSamples; j++) {
                    const coord = new Coordinate(
                        boundingBox.minLatitude + (boundingBox.maxLatitude - boundingBox.minLatitude) * i / numSamples,
                        boundingBox.minLongitude + (boundingBox.maxLongitude - boundingBox.minLongitude) * j / numSamples,
                        (z === 0) ? boundingBox.minElevation : boundingBox.maxElevation,
                    );
                    points.push(this.datum.toCarthesian(coord));
                }
            }

        const bbox = BoundingBox.fromVectors(points)!;
        const center = bbox.centerVector;

        let maxDistanceFromCenter = 0;
        for (const point of points) {
            const distance = point.distanceTo(center);
            if (distance > maxDistanceFromCenter)
                maxDistanceFromCenter = distance;
        }

        boundingSphere = new BoundingSphere(center, maxDistanceFromCenter * 1.1);

        this.approximationCache.set(key, boundingSphere);

        return boundingSphere;
    }
}