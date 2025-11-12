import { Controller, Get } from '@nestjs/common';

@Controller('user')
export class UserController {
  @Get()
  health() {
    console.log('UserController');
    return {
      status: 'ok',
      message: 'Server is running',
    };
  }
}
