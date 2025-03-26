import { DoubleVector3 } from "../geometry/DoubleVector3";
import { IntersectionType, Ray3 } from "../geometry/Ray3";

/**
 * Represents a model that can be intersected by a ray.
 * We have to keep a copy of the vertex- and index buffer, because we cannot read
 * the buffers from the GPU. I mean, we could, but that would be slow and cumbersome.
 */
export class IntersectableModel {
    protected vertices: DoubleVector3[] = [];
    protected indices?: number[] | undefined = undefined;

    /**
     * Intersects a ray (in model space) with the model
     * @param modelSpaceRay Ray in model space
     * @returns Intersection information if the ray intersects the model, undefined otherwise. Intersection point is in model space.
     */
    protected intersect(modelSpaceRay: Ray3): IntersectionType | undefined {
        let closestIntersection: IntersectionType | undefined = undefined;

        if (this.indices === undefined) {
            // No index buffer defined, form triangles from successive vertices
            for (let i = 0; i < this.vertices.length; i += 3) {
                const p1 = this.vertices[i];
                const p2 = this.vertices[i + 1];
                const p3 = this.vertices[i + 2];

                const intersection = modelSpaceRay.intersectTriangle(p1, p2, p3);

                if (intersection &&
                    (!closestIntersection || intersection.distance < closestIntersection.distance))
                    closestIntersection = intersection;
            }

            return closestIntersection;
        }

        // Use index buffer to form triangles
        for (let i = 0; i < this.indices.length; i += 3) {
            const p1 = this.vertices[this.indices[i]];
            const p2 = this.vertices[this.indices[i + 1]];
            const p3 = this.vertices[this.indices[i + 2]];

            const intersection = modelSpaceRay.intersectTriangle(p1, p2, p3);

            if (intersection &&
                (!closestIntersection || intersection.distance < closestIntersection.distance))
                closestIntersection = intersection;
        }

        return closestIntersection;
    }
}