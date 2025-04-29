import {ServiceType} from "../../enums";

export interface IdentifyHandle {
    type: ServiceType;
    servicePrefix: string;
    startTime: number;
}

interface CacheDeleteHandle {
    id: string|number;
    servicePrefix: string;
}

interface CacheSetHandle<T> {
    object: T;
    servicePrefix: string;
}
