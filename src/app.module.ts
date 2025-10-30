import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientModule } from './client/client.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './shared/utils/database/database.service';
import configuration from './shared/configs/configuration';

@Module({
  imports: [
    ClientModule,

    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      expandVariables: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseService],
})
export class AppModule {}
