//import { CaGuid } from '../AliasTypes';
// TODO: caGuid fields must be of type 'CaGuid' but alias types are not _yet_ supported
// TODO: see: https://github.com/lukeautry/tsoa/issues/429

export interface RawPortMetric {
    caGuid: string;
    portNumber: number;

    xmit: number;
    rcv: number;
}
