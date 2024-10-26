export class Cache<K, T> {
    constructor(private maxCacheSize: number) { }

    private generation = 1;

    private generationMap = new Map<K, number>();
    private contentMap = new Map<K, T>();

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

    /**
     * Marks a given element as used (as long as it exists in the cache)
     * @param key Key
     */
    touch(key: K) {
        if (!this.generationMap.has(key))
            return;

        this.generationMap.set(key, this.generation);
    }

    clear() {
        this.contentMap.clear();
        this.generationMap.clear();
    }

    /**
     * Removes the least used elements from the cache
     */
    private preempt() {
        const numElementsToRemove = Math.max(1, Math.floor(this.maxCacheSize * 0.75));

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

        this.contentMap.delete(minKey);
        this.generationMap.delete(minKey);
        return true;
    }
}
