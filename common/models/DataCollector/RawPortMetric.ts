import { CaGuid } from '../AliasTypes';

export interface RawPortMetric {
    caGuid: CaGuid;
    portNumber: number;

    xmit: number;
    rcv: number;
}
