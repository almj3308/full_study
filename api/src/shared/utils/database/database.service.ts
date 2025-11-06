import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mysql from 'mysql2/promise';

@Injectable()
export class DatabaseService {
  private pool: mysql.Pool;

  constructor(private configService: ConfigService) {
    this.pool = mysql.createPool({
      host: this.configService.get<string>('database.host'),
      port: this.configService.get<number>('database.port'),
      user: this.configService.get<string>('database.username'),
      password: this.configService.get<string>('database.password'),
      database: this.configService.get<string>('database.database'),
      charset: this.configService.get<string>('database.charset'),
      connectionLimit: this.configService.get<number>(
        'database.connectionLimit',
      ),
    });
    console.log(this.configService.get<string>('database.host'));
    console.log(this.configService.get<string>('database.port'));
    console.log(this.configService.get<string>('database.username'));
    console.log(this.configService.get<string>('database.password'));
    console.log(this.configService.get<string>('database.database'));
    console.log(this.configService.get<string>('database.charset'));
  }

  async getConnection(): Promise<mysql.PoolConnection> {
    return this.pool.getConnection();
  }

  // queryService
  async sqlService(sqlString: string, values: Array<any> = []): Promise<any> {
    const connection = await this.getConnection();
    try {
      const [results] = await connection.query(sqlString, values);
      return results;
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }
}
