import store from '@/modules/store';
import {RawLocation} from 'vue-router';
import {TopologyTreeUtils} from '../../../common/TopologyTreeUtils';
import {TopologyElement, TopologyHost} from '../../../common/models/Client/TopologyTreeModels';
import {isCaElement, isConnectionElement, isHostElement, isPortElement} from '../../../common/ElementTreeTypeGuards';
import {TimeRange} from '@/libs/TimeRange';
import {router} from '@/modules/router';

export class RouterUtils {
    /**
     * Returns the router location for an TopologyElement
     * @param {TopologyElement} element
     * @returns {RawLocation} The destination that can be used to push a state to the router
     */
    public static getLocationForElement(element?: TopologyElement): RawLocation {
        if (store.state.fabric == null) {
            throw new Error('Current fabric is null');
        }

        const basePath = `/fabric/${store.state.fabric.fabricId}`;
        if (!element) {
            return {
                query: router.currentRoute.query,
                path: basePath,
            };
        }

        if (isConnectionElement(element)) {
            return {
                query: router.currentRoute.query,
                path: `${basePath}/connection/${element.connectionId}`,
            };
        }

        if (isHostElement(element)) {
            return {
                query: router.currentRoute.query,
                path: `${basePath}/${element.hostname}`,
            };
        }

        return {
            query: router.currentRoute.query,
            path: `${basePath}/`,
        };

    }

    public static getLocationForTimeRange(timeRange: TimeRange): RawLocation {
        return {
            query: {
                from: timeRange.from.unix().toString(),
                to: timeRange.to.unix().toString(),
            },
        };
    }

    public static async pushAsync(location: RawLocation) {
        await new Promise<void>((resolve, reject) => {
            // Using 'resolve' instead of 'reject'
            // since the router rejects the push if the path is the same
            router.push(location, resolve, (err) => { resolve(); });
        });
    }
}
