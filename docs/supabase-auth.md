# Autenticação com Supabase

## 📋 Visão Geral

Este guia explica como integrar a autenticação do Supabase no backend NestJS, permitindo login social (Google, GitHub), magic links e autenticação tradicional.

## 🎯 Estratégias de Autenticação

### Opção 1: Auth do Supabase (Recomendado)
- ✅ Login social (Google, GitHub, etc.)
- ✅ Magic links (email sem senha)
- ✅ Gerenciamento de usuários no dashboard
- ✅ JWT automático
- ✅ Row Level Security (RLS)

### Opção 2: Auth Customizado (NestJS)
- ✅ Controle total
- ✅ Lógica de negócio específica
- ⚠️ Mais trabalho de implementação

## 1. Configurar Auth do Supabase

### 1.1 Habilitar Providers

No dashboard do Supabase:

1. **Authentication** → **Providers**
2. Habilite os providers desejados:

#### Email/Password
```
✅ Enable Email provider
✅ Confirm email (opcional)
```

#### Google OAuth
```
1. Google Cloud Console → Create OAuth 2.0 Client
2. Authorized redirect URIs:
   https://[project-ref].supabase.co/auth/v1/callback
3. Copie Client ID e Client Secret
4. Cole no Supabase → Google provider
```

#### GitHub OAuth
```
1. GitHub → Settings → Developer settings → OAuth Apps
2. Authorization callback URL:
   https://[project-ref].supabase.co/auth/v1/callback
3. Copie Client ID e Client Secret
4. Cole no Supabase → GitHub provider
```

### 1.2 Configurar Redirect URLs

```
Authentication → URL Configuration

Site URL: https://seu-frontend.netlify.app
Redirect URLs:
  - http://localhost:5173/**
  - https://seu-frontend.netlify.app/**
```

## 2. Instalar Dependências

```bash
cd packages/backend
npm install @supabase/supabase-js
npm install -D @types/passport-jwt
npm install passport passport-jwt
npm install @nestjs/passport @nestjs/jwt
```

## 3. Criar Módulo de Autenticação

### 3.1 Auth Module

```typescript:packages/backend/src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SupabaseStrategy } from './strategies/supabase.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN') || '7d',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, SupabaseStrategy],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
```

### 3.2 Auth Service

```typescript:packages/backend/src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_ANON_KEY')!,
    );
  }

  /**
   * Valida token do Supabase e sincroniza usuário
   */
  async validateSupabaseToken(token: string): Promise<User> {
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid token');
    }

    // Sincroniza usuário com banco local
    let user = await this.userRepository.findOne({
      where: { email: data.user.email },
    });

    if (!user) {
      user = this.userRepository.create({
        email: data.user.email!,
        name: data.user.user_metadata?.name || data.user.email!,
        oauthProvider: data.user.app_metadata?.provider,
        oauthId: data.user.id,
        active: true,
      });
      await this.userRepository.save(user);
    }

    return user;
  }

  /**
   * Gera JWT interno do backend
   */
  generateJwt(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  /**
   * Valida JWT interno
   */
  async validateJwt(payload: any): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  /**
   * Login com email/password via Supabase
   */
  async signInWithPassword(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    const user = await this.validateSupabaseToken(data.session.access_token);

    return {
      user,
      accessToken: this.generateJwt(user),
      supabaseToken: data.session.access_token,
    };
  }

  /**
   * Registro com email/password
   */
  async signUp(email: string, password: string, name: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return {
      message: 'Check your email for confirmation link',
      user: data.user,
    };
  }

  /**
   * Logout
   */
  async signOut(token: string) {
    await this.supabase.auth.admin.signOut(token);
  }
}
```

### 3.3 JWT Strategy

```typescript:packages/backend/src/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    return this.authService.validateJwt(payload);
  }
}
```

### 3.4 Supabase Strategy

```typescript:packages/backend/src/modules/auth/strategies/supabase.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { AuthService } from '../auth.service';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    return this.authService.validateSupabaseToken(token);
  }
}
```

### 3.5 Auth Controller

```typescript:packages/backend/src/modules/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.signInWithPassword(body.email, body.password);
  }

  @Post('signup')
  async signup(
    @Body() body: { email: string; password: string; name: string },
  ) {
    return this.authService.signUp(body.email, body.password, body.name);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    await this.authService.signOut(token);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: any) {
    return req.user;
  }
}
```

## 4. Proteger Rotas

### 4.1 Guard Simples

```typescript:packages/backend/src/modules/ingest/ingest.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('ingest')
export class IngestController {
  @Post()
  @UseGuards(AuthGuard('jwt')) // Protege a rota
  async ingest(@Body() data: any) {
    // ...
  }
}
```

### 4.2 Role-Based Guard

```typescript:packages/backend/src/modules/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler(),
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredRoles.includes(user.role);
  }
}
```

### 4.3 Decorator de Roles

```typescript:packages/backend/src/modules/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
```

### 4.4 Uso

```typescript
@Get('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
async adminOnly() {
  return { message: 'Admin only' };
}
```

## 5. Variáveis de Ambiente

Adicione ao `.env`:

```env
# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Supabase (já configurado)
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

## 6. Frontend Integration

### 6.1 Login Flow

```typescript
// Frontend - Login com Supabase
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// Enviar token para backend
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${data.session.access_token}`,
  },
});
```

### 6.2 Social Login

```typescript
// Google
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'http://localhost:5173/auth/callback',
  },
});

// GitHub
await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: 'http://localhost:5173/auth/callback',
  },
});
```

## 7. Testing

```bash
# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get profile
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 8. Segurança

### 8.1 Rate Limiting

Já configurado no `app.module.ts` com `ThrottlerModule`.

### 8.2 CORS

Já configurado no `main.ts`.

### 8.3 Helmet

```bash
npm install helmet
```

```typescript:packages/backend/src/main.ts
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  // ...
}
```

## 9. Próximos Passos

- ✅ Autenticação configurada
- ⏳ Implementar refresh tokens
- ⏳ Adicionar 2FA (Two-Factor Authentication)
- ⏳ Implementar recuperação de senha
- ⏳ Adicionar audit logs

## 📚 Recursos

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [Passport.js](http://www.passportjs.org/)

