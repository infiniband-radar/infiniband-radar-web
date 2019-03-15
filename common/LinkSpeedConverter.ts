import { LinkDetails, LinkType } from './models/AliasTypes';

export class LinkSpeedConverter {
    // Source https://en.wikipedia.org/wiki/InfiniBand#Performance
    private static linkSpeed: {[linkType: number]: number} = {
        [LinkType.SDR]:   LinkSpeedConverter.gBitToByte(2),
        [LinkType.DDR]:   LinkSpeedConverter.gBitToByte(4),
        [LinkType.QDR]:   LinkSpeedConverter.gBitToByte(8),
        [LinkType.FDR10]: LinkSpeedConverter.gBitToByte(10),
        [LinkType.FDR]:   LinkSpeedConverter.gBitToByte(13.5),
        [LinkType.EDR]:   LinkSpeedConverter.gBitToByte(25),
        [LinkType.HDR]:   LinkSpeedConverter.gBitToByte(50),
    };

    public static getMaxLinkSpeed(linkDetails: LinkDetails): number {
        return LinkSpeedConverter.linkSpeed[linkDetails.linkType] * linkDetails.linkWidth;
    }

    /**
     * Will return the relative usage of a link
     * @param linkDetails
     * @param usageInBytes
     * @returns {Number} A number from 0 to 1 where 1 stands for 100% usage
     */
    public static getRelativeUsage(linkDetails: LinkDetails, usageInBytes: number): number {
        return usageInBytes / LinkSpeedConverter.getMaxLinkSpeed(linkDetails);
    }

    private static gBitToByte(gBit: number): number {
        return gBit * 125000000;
    }
}
