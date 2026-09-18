export type Handler<T> = (payload: T) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface EventBus<Events extends Record<string, any>> {
    on<K extends keyof Events>(type: K, handler: Handler<Events[K]>): () => void;
    off<K extends keyof Events>(type: K, handler: Handler<Events[K]>): void;
    emit<K extends keyof Events>(type: K, payload: Events[K]): void;
    clear(): void;
}

/** A typed publish/subscribe channel — how services such as toast and confirm reach the component that renders them. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createEventBus<Events extends Record<string, any>>(): EventBus<Events> {
    const handlers = new Map<keyof Events, Set<Handler<never>>>();
    const bus: EventBus<Events> = {
        on(type, handler) {
            if (!handlers.has(type)) handlers.set(type, new Set());
            handlers.get(type)!.add(handler as Handler<never>);
            return () => bus.off(type, handler);
        },
        off(type, handler) {
            handlers.get(type)?.delete(handler as Handler<never>);
        },
        emit(type, payload) {
            handlers.get(type)?.forEach((handler) => (handler as Handler<typeof payload>)(payload));
        },
        clear() {
            handlers.clear();
        }
    };
    return bus;
}
