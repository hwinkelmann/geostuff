using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Nitro.Data.Cache
{
    internal class Element<VALUE>
    {
        internal VALUE Value;

        internal ulong Age = 0;

        internal Element(VALUE value, ulong age)
        {
            Value = value;
            Age = age;
        }
    }
}
