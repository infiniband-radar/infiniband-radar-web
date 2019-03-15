import {
    TopologyCa, TopologyConnection,
    TopologyElement,
    TopologyHost,
    TopologyPort,
} from './models/Client/TopologyTreeModels';

export function isConnectionElement(element?: TopologyElement): element is TopologyConnection {
    return element != null && 'connectionId' in element;
}

export function isHostElement(element?: TopologyElement): element is TopologyHost {
    return element != null && 'hostname' in element;
}

export function isCaElement(element?: TopologyElement): element is TopologyCa {
    return element != null && 'caGuid' in element;
}

export function isPortElement(element?: TopologyElement): element is TopologyPort {
    return element != null && 'portNumber' in element;
}
