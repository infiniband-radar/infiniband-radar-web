import {TopologyConnection} from '../../../common/models/Client/TopologyTreeModels';
import {LinkDetails} from '../../../common/models/AliasTypes';
import * as md5 from 'md5';
import randomColor from 'randomcolor';

export class RandomColorUtils {
    private static LINK_TYPE_HASH_SEED = 1; // best looking so far

    public static getMetricColorForConnection(element: TopologyConnection) {
        return randomColor({
            seed: element.connectionId,
            luminosity: 'dark',
        });
    }

    public static getLinkTypeColor(link: LinkDetails) {
        return randomColor({
            seed: RandomColorUtils.getLinkHash(link),
            luminosity: 'dark',
            format: 'rgba',
            alpha: 0.9,
        });
    }

    private static getLinkHash(linkDetails: LinkDetails): string {
        return md5(`${RandomColorUtils.LINK_TYPE_HASH_SEED}${linkDetails.linkType}${linkDetails.linkWidth}`);
    }
}
