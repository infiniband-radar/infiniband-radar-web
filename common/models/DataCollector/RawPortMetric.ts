//import { CaGuid } from '../AliasTypes';

export interface RawPortMetric {
    caGuid: string; // TODO: Must be of type 'CaGuid' but alias types are not _yet_ supported, see: https://github.com/lukeautry/tsoa/issues/429
    portNumber: number;

    xmit: number;
    rcv: number;
}
