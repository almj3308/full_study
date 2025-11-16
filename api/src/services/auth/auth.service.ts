import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from 'src/shared/utils/database/database.service';
import * as CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private readonly ds: DatabaseService,
    // [여기 고쳤음] JwtService를 주입해 JWT 발급 기능을 사용할 수 있도록 확장
    private readonly jwtService: JwtService,
  ) {
    //
  }

  // 회원 가입 요청을 처리하며 받은 비밀번호를 PBKDF2로 해시한 뒤 USER 및 USER_AUTH 테이블에 저장
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
      // uuid = unique id (선택사항): 회원 가입 시 고유한 식별자 생성
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

  // USER 테이블의 전체 레코드를 조회하여 단순 리스트 응답을 만드는 메서드
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

  // 이메일/비밀번호로 사용자를 조회하고 검증에 성공하면 JWT 발급 단계로 이어질 수 있는 로그인 메서드
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
      // console.log('passportKey', passportKey);
      // console.log('res.auth_passport', res.auth_passport);

      if (passportKey !== res.auth_passport) {
        // 비밀번호가 틀렸으므로 JWT 발급 없이 에러 반환
        return {
          status: 'error',
          // token: jwt 토큰
          message: '이메일 또는 비밀번호가 일치하지 않습니다.',
        };
      } else {
        // [서버] jwt 토큰 생성
        // 과제 1
        // [프론트] 쿠키(스토리지)에 jwt 토큰 저장
        // 과제 2
        // [프론트 - 디렉티브] 헤더에 토큰을 태워보낼 수 있도록 세팅
        // 과제 3
        // [심화 과제] 토큰을 1년짜리, 한달짜리 두개 생성
        // 1년짜리 = DB저장 / 한달짜리 = 쿠키(스토리지)에 저장
        // (한달짜리 5일남고 1년짜리 더 남아있으면 한달짜리를 기한연장)
        // 과제 4

        // ! [서버] jwt 토큰 생성: 비밀번호가 일치할 때 accessToken/refreshToken을 발급하는 위치
        // [여기 고쳤음] 비밀번호 일치 시 서버에서 JWT(access/refresh)를 생성해 응답에 포함
        const payload = {
          sub: res.user_id, // JWT 표준 클레임: 사용자 고유 ID(subject)
          email: res.user_email, // 토큰에 함께 담아둘 사용자 이메일
          name: res.user_name, // 클라이언트 표시용 사용자 이름
          provider: res.user_provider, // 가입 경로(예: local, kakao 등)
        };
        const accessToken = await this.jwtService.signAsync(payload, {
          expiresIn: '30m', // 액세스 토큰 만료 시간을 30분으로 설정
        });
        const refreshToken = await this.jwtService.signAsync(
          { ...payload, tokenType: 'refresh' }, // 동일 payload에 refresh 토큰임을 나타내는 필드 추가
          { expiresIn: '365d' }, // 리프레시 토큰은 365일 동안 유효
        );

        // TODO: refreshToken을 USER_AUTH 등 DB에 저장하고, accessToken은 쿠키/헤더로 내려 프론트에서 보관하도록 확장
        // ! DB에 리프레시토큰 저장
        let sql = `UPDATE USER_AUTH SET refresh_token = ? WHERE user_id = ?`;
        let params = [refreshToken, res.user_id];
        let result = await this.ds.sqlService(sql, params);
        // ! 프론트로 토큰 반환

        // 과제 1: JWT 생성 시 사용자 식별자, 권한, 만료시간을 payload에 담도록 구현
        // [프론트] 쿠키(스토리지)에 jwt 토큰 저장: 프론트엔드에서 서버가 내려준 JWT를 안전한 스토리지에 보관
        // 과제 2: SameSite/HttpOnly 정책을 고려하여 쿠키로 저장하는 로직 작성
        // [프론트 - 디렉티브] 헤더에 토큰을 태워보낼 수 있도록 세팅: 이후 API 호출 시 Authorization 헤더에 JWT를 포함
        // 과제 3: 인터셉터/디렉티브를 활용해 토큰을 자동 첨부하는 로직 개발
        // [심화 과제] 토큰을 1년짜리, 한달짜리 두개 생성: refreshToken(1년)과 accessToken(1달)로 이중화
        // 1년짜리 = DB 저장 / 한달짜리 = 쿠키(스토리지)에 저장: refreshToken은 서버에 보관하여 보안성 강화
        // (한달짜리 5일 남았고 1년짜리가 더 남아있으면 한달짜리를 기한 연장): refreshToken으로 accessToken 재발급 로직 작성
        // 과제 4: 만료 임박 시 재발급 흐름을 구현하여 사용자 경험 개선
        return {
          status: 'ok',
          message: '로그인 성공',
          data: {
            accessToken,
            // refreshToken, // HttpOnly 쿠키로 저장해야함
          },
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
