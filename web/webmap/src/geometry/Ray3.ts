import { DoubleMatrix } from "./DoubleMatrix";
import { DoubleVector3 } from "./DoubleVector3";

export type IntersectionType = {
    point: DoubleVector3;
    distance: number;
}

export class Ray3 {
    constructor(public origin: DoubleVector3, public direction: DoubleVector3) {
    }

    public getPointAt(t: number): DoubleVector3 {
        return this.origin.clone().add(this.direction.clone().multiply(t));
    }

    public transform(matrix: DoubleMatrix): Ray3 {
        return new Ray3(
            this.origin.transform(matrix),
            this.direction.transform(matrix),
        );
    }

    /**
     * Calculates the intersection of this ray with a bounding sphere
     * @param center Sphere center coordinates
     * @param radius Radius of the sphere
     * @returns Intersection points if the ray intersects the sphere, an empty array otherwise
     */
    public intersectSphere(center: DoubleVector3, radius: number): DoubleVector3[] {
        const oc = this.origin.clone().subtract(center);
        const a = this.direction.dot(this.direction);
        const b = 2.0 * oc.dot(this.direction);
        const c = oc.dot(oc) - radius * radius;
        const discriminant = b * b - 4 * a * c;

        if (discriminant < 0)
            return [];

        const r = Math.sqrt(discriminant);
        const t1 = (-b + r) / (2 * a);
        const t2 = (-b - r) / (2 * a);

        return [
            new DoubleVector3(this.origin.x + t1 * this.direction.x, this.origin.y + t1 * this.direction.y, this.origin.z + t1 * this.direction.z),
            new DoubleVector3(this.origin.x + t2 * this.direction.x, this.origin.y + t2 * this.direction.y, this.origin.z + t2 * this.direction.z),
        ];
    }

    /**
     * Calculates the intersection of this ray with a triangle using the Müller-Trumbore algorithm.
     * See https://en.wikipedia.org/wiki/M%C3%B6ller%E2%80%93Trumbore_intersection_algorithm for details.
     * @param p1 First point of the triangle
     * @param p2 Second point of the triangle
     * @param p3 Third point of the triangle
     * @returns Intersection point and distance if the ray intersects the triangle, undefined otherwise
     */
    public intersectTriangle(p1: DoubleVector3, p2: DoubleVector3, p3: DoubleVector3): IntersectionType | undefined {
        const e1 = new DoubleVector3(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z);
        const e2 = new DoubleVector3(p3.x - p1.x, p3.y - p1.y, p3.z - p1.z);
        const h = this.direction.cross(e2);
        const a = e1.dot(h);

        if (a > -Number.EPSILON && a < Number.EPSILON)
            // Ray is parallel to the triangle, no intersection
            return undefined;

        const f = 1 / a;
        const s = this.origin.clone().subtract(p1);
        const u = f * s.dot(h);

        if (u < 0 || u > 1)
            // Intersection is outside the triangle
            return undefined;

        const q = s.cross(e1);
        const v = f * this.direction.dot(q);

        if (v < 0 || (u + v) > 1)
            // Intersection is outside the triangle
            return undefined;

        // Calculate t to find intersection point along the ray
        const t = f * e2.dot(q);

        // Check if
        //  - the intersection is behind the ray
        //  - the intersection is somewhat closer than the current closest intersection.
        //    This is not necessary for correctness, but when using this function e.g. 
        //    for ray tracing, this check avoids unnecessary calculations.
        // 
        // Also, multiplying with something smaller than Number.EPSILON rarely is a 
        // good idea anyway.
        if (t <= Number.EPSILON)
            return undefined;

        return {
            point: this.origin.clone().add(this.direction.clone().multiply(t)),
            distance: t * this.direction.length(),
        };
    }
}