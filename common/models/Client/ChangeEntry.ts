import { LinkDetails } from '../AliasTypes';
import { SubnetManagerState } from './TopologyTreeModels';

export enum ChangeType {
    ConnectionAdded,
    ConnectionRemoved,
    HostAdded,
    HostRemoved,
    LinkTypeChanged,
    SubnetManagerStateChanged,
}

export enum ChangeTypeStatus {
    Added = 'added',
    Modified = 'modified',
    Removed = 'removed',
}

export enum ChangeTypeCategory {
    Connection = 'connection',
    Host = 'host',
}

export const changeTypeToStatus: Readonly<{
    [changeType: number]: Readonly<{
        category: ChangeTypeCategory,
        status: ChangeTypeStatus}>,
    }> = {
    [ChangeType.ConnectionAdded]: {
        category: ChangeTypeCategory.Connection,
        status: ChangeTypeStatus.Added,
    },
    [ChangeType.ConnectionRemoved]: {
        category: ChangeTypeCategory.Connection,
        status: ChangeTypeStatus.Removed,
    },
    [ChangeType.HostAdded]: {
        category: ChangeTypeCategory.Host,
        status: ChangeTypeStatus.Added,
    },
    [ChangeType.HostRemoved]: {
        category: ChangeTypeCategory.Host,
        status: ChangeTypeStatus.Removed,
    },
    [ChangeType.LinkTypeChanged]: {
        category: ChangeTypeCategory.Connection,
        status: ChangeTypeStatus.Modified,
    },
    [ChangeType.SubnetManagerStateChanged]: {
        category: ChangeTypeCategory.Host,
        status: ChangeTypeStatus.Modified,
    },
};

export type ChangeEntry =
    ChangedHostEntry |
    ChangedConnectionEntry |
    ChangedLinkTypeEntry |
    ChangedSubnetManagerStateEntry
    ;

export interface ChangeBaseEntry {
    changeType: ChangeType;
}

export interface ChangedHostEntry extends ChangeBaseEntry {
    changeType: ChangeType.HostAdded | ChangeType.HostRemoved;
    hostname: string;
    smState?: SubnetManagerState;
}

export interface ChangedSubnetManagerStateEntry extends ChangeBaseEntry {
    changeType: ChangeType.SubnetManagerStateChanged;
    hostname: string;
    smState?: SubnetManagerState;
    newSmState?: SubnetManagerState;
}

export interface ChangedConnectionEntry extends ChangeBaseEntry {
    changeType: ChangeType.ConnectionAdded | ChangeType.ConnectionRemoved;
    portAHostname: string;
    portACaDesc: string;
    portAPort: number;
    portBHostname: string;
    portBCaDesc: string;
    portBPort: number;
    link: LinkDetails;
}

export interface ChangedLinkTypeEntry extends ChangeBaseEntry {
    changeType: ChangeType.LinkTypeChanged;
    portAHostname: string;
    portACaDesc: string;
    portAPort: number;
    portBHostname: string;
    portBCaDesc: string;
    portBPort: number;
    link: LinkDetails;
    newLink: LinkDetails;
}
