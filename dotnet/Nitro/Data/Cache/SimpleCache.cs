namespace Nitro.Data.Cache
{
    public class SimpleCache<KEY, VALUE> where KEY : notnull
    {
        private readonly Dictionary<KEY, Element<VALUE>> _values;

        private int maxSize;

        private ulong generation = 0;

        public SimpleCache(int maxSize)
        {
            this.maxSize = maxSize;
            this._values = new Dictionary<KEY, Element<VALUE>>(maxSize);
        }

        /// <summary>
        /// Adds an element to the cache
        /// </summary>
        /// <param name="key">Key</param>
        /// <param name="value">Value</param>
        public void Add(KEY key, VALUE value)
        {
            lock (_values)
            {
                generation++;
                _values[key] = new Element<VALUE>(value, generation);
                if (_values.Count >= maxSize)
                    Preempt();
            }
        }

        /// <summary>
        /// Checks if a given element is currently in cache
        /// </summary>
        /// <param name="key">Key to look up</param>
        /// <returns>true if element is cached, false otherwise</returns>
        public bool Has(KEY key)
        {
            lock ( _values)
            {
                return _values.ContainsKey(key);
            }
        }

        /// <summary>
        /// Returns an element with the given key
        /// </summary>
        /// <param name="key">Key to look up</param>
        /// <returns>Element or default value</returns>
        public VALUE? Get(KEY key)
        {
            lock (_values)
            {
                Element<VALUE>? result;
                if (!_values.TryGetValue(key, out result))
                    return default(VALUE);

                generation++;
                result.Age = generation;

                return result.Value;
            }
        }

        private void Preempt()
        {
            // Select half of the elements for removal
            var elementsToRemove = this._values.OrderBy(e => e.Value.Age).Take(maxSize / 2).Select(e => e.Key);
            foreach (var key in elementsToRemove)
                _values.Remove(key);

            // Reset age
            var minAge = _values.Values.Min(v => v.Age);
            generation -= minAge;
            foreach (var element in _values.Values)
                element.Age -= minAge;
        }
    }
}
