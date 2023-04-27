import { Vector2 } from "./geometry/Vector2";
import { Vector3 } from "./geometry/Vector3";

export class Mesh {
    public vertices: Vector3[] = [];
    public indices: number[] = [];
    public normals: Vector3[] = [];
    public uv: Vector2[] = [];
}