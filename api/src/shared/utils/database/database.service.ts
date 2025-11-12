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

  async insertTransaction(sqls: string[], params: any[]) {
    console.log('sqls', params);
    const connection = await this.getConnection();
    try {
      // beginTransaction = 트랜잭션을 시작함
      await connection.beginTransaction();

      const [results1]: any = await connection.query(sqls[0], params[0]);
      params[1] = [...params[1], results1.insertId];
      const [results2]: any = await connection.query(sqls[1], params[1]);

      // commit
      await connection.commit();

      return {
        status: 'ok',
        message: '트랜잭션 성공',
      };
    } catch (e) {
      // 커넥션 되돌림
      await connection.rollback();
      throw e;
    } finally {
      // 커넥션 종료
      connection.release();
    }
  }
}
