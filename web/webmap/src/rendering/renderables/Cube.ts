import { RenderContext } from "../RenderContext";

export class Cube {
   public static vertexBuffer: WebGLBuffer | null = null;
   public static indexBuffer: WebGLBuffer | null = null;
   public static colorBuffer: WebGLBuffer | null = null;

   constructor(context: RenderContext) {
      this.init(context);
   }

   public init(context: RenderContext) {
      if (!Cube.vertexBuffer) {
         Cube.vertexBuffer = context.gl.createBuffer();
         if (!Cube.vertexBuffer)
            throw new Error("Could not create vertex buffer");

         // Prepare vertex data
         const vertices = [
            -1, -1, -1,   1, -1, -1,   1, 1, -1,   -1, 1, -1,  // Front face
            -1, -1, 1,    1, -1, 1,    1, 1, 1,     -1, 1, 1,  // Back face
            -1, -1, -1,  -1, 1, -1,   -1, 1, 1,    -1, -1, 1,  // Left face
            1, -1, -1,    1, 1, -1,    1, 1, 1,     1, -1, 1,  // Right face
            -1, -1, -1,  -1, -1, 1,    1, -1, 1,   1, -1, -1,  // Bottom face
         
            1, 1, -1,  1, 1, 1, -1, 1, 1, -1, 1, -1,   // Top face
         ];

         context.gl.bindBuffer(context.gl.ARRAY_BUFFER, Cube.vertexBuffer);
         context.gl.bufferData(context.gl.ARRAY_BUFFER, new Float32Array(vertices), context.gl.STATIC_DRAW);
      }

      // Prepare index data
      if (!Cube.indexBuffer) {
         Cube.indexBuffer = context.gl.createBuffer();
         if (!Cube.indexBuffer)
            throw new Error("Could not create index buffer");

         context.gl.bindBuffer(context.gl.ELEMENT_ARRAY_BUFFER, Cube.indexBuffer);
         context.gl.bufferData(context.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([
            0, 1, 2, 0, 2, 3,       // Front 
            6, 5, 4, 7, 6, 4,       // Back 
            16, 17, 18, 16, 18, 19, // Bottom 
            22, 23, 20 , 21, 22, 20,  // Top 
            8, 9, 10, 8, 10, 11,    // Left 
            14, 13, 12, 15, 14, 12, // Right 
            
         ]), context.gl.STATIC_DRAW);
      }

      if (!Cube.colorBuffer) {
         var colors = [
            5, 3, 7, 5, 3, 7, 5, 3, 7, 5, 3, 7,
            1, 1, 3, 1, 1, 3, 1, 1, 3, 1, 1, 3,
            0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
            1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0,
            0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0
         ];

         // Create and store data into color buffer
         Cube.colorBuffer = context.gl.createBuffer();
         context.gl.bindBuffer(context.gl.ARRAY_BUFFER, Cube.colorBuffer);
         context.gl.bufferData(context.gl.ARRAY_BUFFER, new Float32Array(colors), context.gl.STATIC_DRAW);
      }
   }
}