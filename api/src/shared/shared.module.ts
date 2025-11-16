import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from 'src/services/auth/auth.service';
import { UserService } from 'src/services/user/user.service';
import { DatabaseService } from './utils/database/database.service';

@Module({
  imports: [
    // [여기 고쳤음] Config/Jwt 모듈을 등록해 AuthService에서 JWT 발급 가능하도록 설정
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
      }),
    }),
  ],
  providers: [AuthService, UserService, DatabaseService],
  exports: [AuthService, UserService, DatabaseService, JwtModule],
})
export class SharedModule {}
