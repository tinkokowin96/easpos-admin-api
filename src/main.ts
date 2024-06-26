import { MERCHANT, USER } from '@common/constant';
import { appBootstrap } from '@common/utils/bootstrap';
import { AppModule } from './app.module';

async function bootstrap() {
  await appBootstrap(AppModule, 4000, [MERCHANT, USER]);
}
bootstrap();
