import { Module } from '@nestjs/common';
import { UserController } from './controllers/user/user.controller';
import { SharedModule } from '../shared/shared.module';
import { AuthController } from './controllers/auth/auth.controller';

@Module({
  imports: [SharedModule],
  controllers: [UserController, AuthController],
  providers: [],
})
export class ClientModule {}
