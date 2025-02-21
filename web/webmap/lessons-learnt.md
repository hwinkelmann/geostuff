# Matrix multiplication

If we have transformations `A` and `B`, and we multiply `C = A * B`, then `B` is applied first, and then `A`.

My coordinate system here is right-handed. negative z values are in front of me, positive ones behind.

# webgl

 - we need to bind buffers first before calling `vertexAttribPointer` or `enableVertexAttribArray`. Otherwise these calls have no idea where we're referring to!
 - texture coordinates: (0/0) is in the bottom left, (1/1) on the top right of a texture (vs top left on WebGPU)
 - viewport space: same as texture space: (0/0) is on the bottom left!
 - clip space: goes from -1 to 1!!! I know, any other graphics API uses the range 0..1 here

 - if buffers don't change, you don't have to set them again