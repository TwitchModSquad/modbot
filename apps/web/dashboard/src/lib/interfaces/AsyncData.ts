export interface AsyncData<T> {
    status: 'loading' | 'success' | 'error';
    data: T | null;
    error: Error | null;
}
