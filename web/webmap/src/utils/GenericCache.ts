export class GenericCache<K, T> {
    constructor(private maxCacheSize: number, private onPreemption?: (k: K, v: T) => void) { }

    private generation = 1;

    private generationMap = new Map<K, number>();
    private contentMap = new Map<K, T>();

    peek(key: K) {
        if (!this.generationMap.has(key))
            return undefined;

        return this.contentMap.get(key);
    }

    get(key: K) {
        if (!this.generationMap.has(key))
            return undefined;

        this.generationMap.set(key, this.generation);
        this.generation++;
        return this.contentMap.get(key);
    }

    set(key: K, value: T) {
        if (this.contentMap.size >= this.maxCacheSize)
            this.preempt();

        const result = this.contentMap.set(key, value);

        this.generationMap.set(key, this.generation);
        this.generation++;

        return result;
    }

    getSize() {
        return this.contentMap.size;
    }
    
    remove(key: K) {
        if (!this.generationMap.has(key))
            return false;

        if (this.onPreemption) {
            const removedElement = this.contentMap.get(key);
            if (removedElement === undefined)
                throw new Error("element not found");

            this.onPreemption(key, removedElement!);
        }

        this.contentMap.delete(key);
        this.generationMap.delete(key);
        return true;
    }

    age() {
        this.generation++;
    }

    /**
     * Marks a given element as used (as long as it exists in the cache)
     * @param key Key
     */
    touch(key: K) {
        if (!this.generationMap.has(key))
            return;

        this.generationMap.set(key, this.generation);
    }

    /**
     * Removes all elements from the cache
     */
    clear() {
        if (this.onPreemption)
            for (const key of this.contentMap.keys()) {
                const value = this.contentMap.get(key);
                if (value === undefined)
                    throw new Error("element not found");

                this.onPreemption(key, value);
            }

        this.contentMap.clear();
        this.generationMap.clear();
    }

    /**
     * Removes the least used elements from the cache
     */
    private preempt() {
        const numElementsToRemove = Math.max(1, Math.floor(this.maxCacheSize * 0.9));

        for (let i = 0; i < numElementsToRemove && this.preemptElement(); i++) {
            // Intentionally empty
        }
    }

    /**
     * Removes the least used element from the cache
     */
    private preemptElement() {
        if (!this.contentMap.size)
            throw new Error("cache is empty");

        let minGeneration = Number.MAX_SAFE_INTEGER;
        let minKey: K | undefined = undefined;

        const itr = this.contentMap.keys();
        let itrElement = itr.next();

        while (!itrElement.done) {
            const currentAge = this.generationMap.get(itrElement.value)!;

            if (minGeneration > currentAge) {
                minGeneration = currentAge;
                minKey = itrElement.value;
            }

            itrElement = itr.next();
        }

        if (minKey === undefined)
            return false;

        if (this.onPreemption) {
            const removedElement = this.contentMap.get(minKey);
            if (removedElement === undefined)
                throw new Error("element not found");

            this.onPreemption(minKey, removedElement!);
        }

        this.contentMap.delete(minKey);
        this.generationMap.delete(minKey);
        return true;
    }
}
