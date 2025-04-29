import {ServiceType} from "../../enums";

export interface IdentifyHandle {
    type: ServiceType;
    servicePrefix: string;
    startTime: number;
}
