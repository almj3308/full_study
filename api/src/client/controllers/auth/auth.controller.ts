import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from 'src/services/auth/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {
    console.log('AuthController');
  }

  @Post('select')
  select() {
    return this.authService.select();
  }

  @Post('create')
  create(@Body() body: any) {
    return this.authService.create(body);
  }

  @Post('login')
  login(@Body() body: any) {
    return this.authService.login(body);
  }
}
