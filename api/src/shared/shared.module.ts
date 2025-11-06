import { Module } from '@nestjs/common';
import { AuthService } from 'src/services/auth/auth.service';
import { UserService } from 'src/services/user/user.service';
import { DatabaseService } from './utils/database/database.service';

@Module({
  providers: [AuthService, UserService, DatabaseService],
  exports: [AuthService, UserService, DatabaseService],
})
export class SharedModule {}
