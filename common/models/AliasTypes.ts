export type FabricId = string;
export type CaGuid = string;
export type ConnectionId = string;

export type CircularJsonObject<T> = string;

export enum HostType {
    Unknown,
    Switch,
    ChannelAdapter,
    Router,
}

export enum LinkType {
    Unknown,
    SDR,
    DDR,
    QDR,
    FDR10,
    FDR,
    EDR,
    HDR,
}

export interface LinkDetails {
    linkType: LinkType;
    linkWidth: number;
}

export function LinkDetailsToString(linkDetails: LinkDetails): string {
    return `${linkDetails.linkWidth}x${LinkType[linkDetails.linkType]}`;
}

export function RawHostTypeToEnum(rawHostType: RawNodeType): HostType {
    switch (rawHostType) {
        case 'SW':
            return HostType.Switch;
        case 'CA':
            return HostType.ChannelAdapter;
        case 'RT':
            return HostType.Router;
    }
    return HostType.Unknown;
}

export function RawLinkSpeedToDetails(rawLinkSpeed: string): LinkDetails {
    const linkParts = rawLinkSpeed.split('x');
    if (linkParts.length !== 2) {
        return {
            linkType: LinkType.Unknown,
            linkWidth: 0,
        };
    }
    const linkWidth = Number(linkParts[0]);
    let linkType: LinkType;
    switch (linkParts[1]) {
    case 'SDR':
        linkType = LinkType.SDR;
        break;
    case 'DDR':
        linkType = LinkType.DDR;
        break;
    case 'QDR':
        linkType = LinkType.QDR;
        break;
    case 'FDR10':
        linkType = LinkType.FDR10;
        break;
    case 'FDR':
        linkType = LinkType.FDR;
        break;
    case 'EDR':
        linkType = LinkType.EDR;
        break;
    case 'HDR':
        linkType = LinkType.HDR;
        break;
    default:
        linkType = LinkType.Unknown;
        break;
    }

    return {
        linkType,
        linkWidth,
    };
}

export type RawNodeType = 'SW' | 'CA' | 'RT';
