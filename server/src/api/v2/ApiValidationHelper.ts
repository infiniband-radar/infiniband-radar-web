import { Container } from 'typescript-ioc';
import { ConfigService } from '../../services/ConfigService';
import { FabricId } from '../../../../common/models/AliasTypes';
import { ApiError } from '../ApiError';

export class ApiValidationHelper {

    private static config = (Container.get(ConfigService) as ConfigService);

    public static ensureValidFabricId(fabricId: FabricId) {
        if (!ApiValidationHelper.config.getFabricConfig(fabricId)) {
            throw new ApiError(`Invalid FabricId '${fabricId}'`, 400);
        }
    }
}
