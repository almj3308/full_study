/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/shared/utils/database/database.service';
import * as CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(private readonly ds: DatabaseService) {
    //
  }

  async create(body: any) {
    const { email, password, name, provider } = body;
    let _sqls: any[] = [];
    let params: any[] = [];

    try {
      const buf = CryptoJS.lib.WordArray.random(64 / 8);
      // salt = bufBase64 동일함
      const bufBase64 = buf.toString(CryptoJS.enc.Base64);
      const iterations = 5000;

      const key = CryptoJS.PBKDF2(password, bufBase64, {
        keySize: 256 / 12,
        iterations: iterations,
        hasher: CryptoJS.algo.SHA512,
      });
      const passportKey = CryptoJS.enc.Base64.stringify(key);
      const saltKey = bufBase64;
      // unique id (선택사항)
      const uuid = uuidv4();

      const _sql_user = `
      INSERT INTO USER (user_email, user_name, user_provider, user_uuid ) VALUES (?, ?, ?, ?);
      `;
      const _params_user = [email, name, provider, uuid];

      const _sql_auth = `
      INSERT INTO USER_AUTH (auth_passport, auth_salt, user_id ) VALUES (?, ?, ?);
      `;

      const _params_auth = [passportKey, saltKey];

      _sqls.push(_sql_user);
      _sqls.push(_sql_auth);
      params.push(_params_user);
      params.push(_params_auth);

      const result = await this.ds.insertTransaction(_sqls, params);
      console.log('result', result);

      return {
        status: 'ok',
        message: '생성 성공',
      };
    } catch (e) {
      console.error('error:', e);
      return {
        status: 'error',
        message: '생성 실패',
      };
    }
  }

  async select() {
    const _sql = `
            SELECT * 
            FROM USER AS U
        `;
    const res = await this.ds.sqlService(_sql, []);
    console.log('res', res);
    return {
      status: 'ok',
      message: '조회 성공',
    };
  }

  async login(body: any) {
    const { email, password } = body;
    try {
      const _sql = ` SELECT U.*, 
          UA.auth_passport,
          UA.auth_salt
        FROM USER AS U
          LEFT JOIN USER_AUTH AS UA ON U.user_id = UA.user_id
        WHERE user_email = ?;
      `;
      const [res] = await this.ds.sqlService(_sql, [email]);
      console.log('res', res);
      if (!res) {
        return {
          status: 'error',
          message: '이메일 또는 비밀번호가 일치하지 않습니다.',
        };
      }

      const key = CryptoJS.PBKDF2(password, res.auth_salt, {
        keySize: 256 / 12,
        iterations: 5000,
        hasher: CryptoJS.algo.SHA512,
      });
      const passportKey = CryptoJS.enc.Base64.stringify(key);
      // const saltKey = bufBase64;
      // // unique id (선택사항)
      // const uuid = uuidv4();

      // 받아온 데이터와 저장된 비밀번호 확인
      console.log('passportKey', passportKey);
      console.log('res.auth_passport', res.auth_passport);

      if (passportKey !== res.auth_passport) {
        // [서버] jwt 토큰 생성
        // 과제 1
        return {
          status: 'error',
          // token: jwt 토큰
          message: '이메일 또는 비밀번호가 일치하지 않습니다.',
        };
        // [프론트] 쿠키(스토리지)에 jwt 토큰 저장
        // 과제 2
        // [프론트 - 디렉티브] 헤더에 토큰을 태워보낼 수 있도록 세팅
        // 과제 3
        // [심화 과제] 토큰을 1년짜리, 한달짜리 두개 생성
        // 1년짜리 = DB저장 / 한달짜리 = 쿠키(스토리지)에 저장
        // (한달짜리 5일남고 1년짜리 더 남아있으면 한달짜리를 기한연장)
        // 과제 4
      } else {
        return {
          status: 'ok',
          message: '로그인 성공: ' + passportKey,
        };
      }
    } catch (e) {
      console.error('error:', e);
      return {
        status: 'error',
        message: '로그인 실패',
      };
    }
  }
}
