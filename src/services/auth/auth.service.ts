import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/shared/utils/database/database.service';

@Injectable()
export class AuthService {
  constructor(private readonly ds: DatabaseService) {
    //
  }
  async insert() {
    // const id = 1234;
    // const pw = 321;
    const _sql = `
            SELECT * 
            FROM USER AS U
            WHERE U.is_deleted = 1
        `;
    const res = await this.ds.sqlService(_sql, []);
    console.log('res', res);
    return {
      status: 'ok',
      message: 'Inserted',
    };
  }
}
