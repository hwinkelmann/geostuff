export class CoordinateSystem {
    private parent: CoordinateSystem | undefined;

    private children: CoordinateSystem[] = [];

}
/*
namespace Nitro.Geometry
{
    public class CoordinateSystem : IDisposable
    {
        public CoordinateSystem? Parent = null;

        public List<CoordinateSystem> Children = new List<CoordinateSystem>();

        public DoubleMatrix Transform = DoubleMatrix.Identity;

        protected DoubleMatrix localTransform = DoubleMatrix.Identity;

        public string Name = string.Empty;

        public CoordinateSystem() { }

        public CoordinateSystem(string Name) 
        {
            this.Name = Name;
        }

        public void Dispose()
        {
            // dispose children
            for (int i = 0; i < Children.Count; i++)
                if (Children[i] != null)
                    Children[i].Dispose();

            if (Parent != null)
                Parent.RemoveChild(this);
        }

        /// <summary>
        /// The local transform (relative to the parent)
        /// </summary>
        public DoubleMatrix LocalTransform
        {
            get
            {
                return localTransform;
            }

            set
            {
                localTransform = value;
                update();
            }
        }

        /// <summary>
        /// Updates this transformation matrix as well as it's children.
        /// </summary>
        protected void update()
        {
            if (Parent == null)
                Transform = localTransform;
            else
                Transform = localTransform * Parent.Transform;

            if (Children.Count > 0)
                foreach (CoordinateSystem child in Children)
                    child.update();
        }

        public void AddChild(CoordinateSystem child)
        {
            Children.Add(child);
            child.Parent = this;
            child.update();
        }

        public void RemoveChild(CoordinateSystem child)
        {
            Children.Remove(child);
            child.Parent = null;
        }

        /// <summary>
        /// Initializes this coordinate system with the basis provided.
        /// </summary>
        /// <param name="translation">Translation</param>
        /// <param name="xAxis">x-Axis</param>
        /// <param name="yAxis">y-Axis</param>
        /// <param name="zAxis">z-Axis</param>
        public void LocalTransformFromVectors(DoubleVector3 translation, DoubleVector3 xAxis, DoubleVector3 yAxis, DoubleVector3 zAxis)
        {
            xAxis.Normalize();
            yAxis.Normalize();
            zAxis.Normalize();

            DoubleMatrix translationMatrix = DoubleMatrix.Translation(translation);

            DoubleMatrix rotationMatrix = DoubleMatrix.Identity;
            rotationMatrix.M11 = xAxis.X;
            rotationMatrix.M12 = xAxis.Y;
            rotationMatrix.M13 = xAxis.Z;

            rotationMatrix.M21 = yAxis.X;
            rotationMatrix.M22 = yAxis.Y;
            rotationMatrix.M23 = yAxis.Z;

            rotationMatrix.M31 = zAxis.X;
            rotationMatrix.M32 = zAxis.Y;
            rotationMatrix.M33 = zAxis.Z;

            // Replace local transformation
            // Be aware that we're using the property LocalTransform, which updates the
            // transformation matrices of this and all child coordinate systems
            LocalTransform = rotationMatrix * translationMatrix;
        }

        public override string ToString()
        {
            return Name;
        }
    }
}
*/