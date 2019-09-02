import { Controller, Get, Route, Security } from 'tsoa';
import { ConfigService } from '../../../services/ConfigService';
import { Inject } from 'typescript-ioc';
import { FabricModel } from '../../../../../common/models/Client/FabricModel';

@Route('v2/fabrics')
export class FabricsController extends Controller {

    @Inject
    private config: ConfigService;

    @Security('user')
    @Get()
    public async getFabrics(): Promise<FabricModel[]> {
        const result: FabricModel[] = [];
        for (const fabricConfig of this.config.getFabricConfigs()) {
            result.push({
                fabricId: fabricConfig.fabricId,
                name: fabricConfig.name,
                image: fabricConfig.image,
                hideFromInitialSelection: (fabricConfig.hideFromInitialSelection || false),
            });
        }
        return result;
    }
}
