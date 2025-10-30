import { Controller, Get, Post } from '@nestjs/common';
import { AuthService } from 'src/services/auth/auth.service';
import { UserService } from 'src/services/user/user.service';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) { 
        console.log('AuthController');
    }

    @Post('insert')
    insert() {
        console.log('insert');
        return this.authService.insert();
    }
}

