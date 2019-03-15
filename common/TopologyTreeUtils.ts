import {
    TopologyCa,
    TopologyConnection,
    TopologyElement, TopologyHost,
    TopologyPort, TopologyRoot,
} from './models/Client/TopologyTreeModels';
import {isCaElement, isConnectionElement, isHostElement, isPortElement} from './ElementTreeTypeGuards';
import {CaGuid} from './models/AliasTypes';

export class TopologyTreeUtils {
    public static tryGetHost(element?: TopologyElement): TopologyHost | undefined {
        if (isHostElement(element)) {
            return element;
        }
        const ca = TopologyTreeUtils.tryGetCa(element);
        return ca ? ca.host : undefined;
    }

    public static tryGetCa(element?: TopologyElement): TopologyCa | undefined {
        if (isCaElement(element)) {
            return element;
        }
        const port = TopologyTreeUtils.tryGetPort(element);
        return port ? port.ca : undefined;

    }
    public static tryGetPort(element?: TopologyElement): TopologyPort | undefined {
        return isPortElement(element) ? element : undefined;
    }

    public static tryGetConnection(element?: TopologyElement): TopologyConnection | undefined {
        if (isConnectionElement(element)) {
            return element;
        }

        const port = TopologyTreeUtils.tryGetPort(element);

        return port ? port.connection : undefined;
    }

    public static getPortByCaAndNumber(root: TopologyRoot, caGuid: CaGuid, portNumber: number): TopologyPort | undefined {
        const ca = root.caMap[caGuid];
        if (!ca) {
            return undefined;
        }
        return ca.ports[portNumber];
    }
}
