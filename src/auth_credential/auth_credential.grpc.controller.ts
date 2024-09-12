import { GetAuthCredentialDto } from '@common/dto/auth_credential.dto';
import GrpcHandler from '@common/decorator/grpc_handler.decorator';
import AuthCredentialService from './auth_credential.service';

@GrpcHandler()
export default class AuthCredentialGrpcController {
   constructor(private readonly service: AuthCredentialService) {}

   async getAuthCredential(dto: GetAuthCredentialDto) {
      return this.service.getAuthCredential(dto);
   }
}
