/**
 * Good idea from web dev simplified:
 * https://www.youtube.com/watch?v=AdmGHwvgaVs
 */

export function catchErrorTyped<T, E extends new (message?: string) => Error>(
    promise: Promise<T>, 
    errorsToCatch?: E[]): Promise<[undefined, T] | [InstanceType<E>]> {
    return promise.
        then(data => [undefined, data] as [undefined, T]).
        catch(error => {
            if (!errorsToCatch)
                return [error];

            if (errorsToCatch.some(e => error instanceof e))
                return [error];

            throw error;
        });
}