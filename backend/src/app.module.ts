import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

// Configuration
import configuration from './config/configuration';

<<<<<<< Updated upstream
// Modules (seront ajoutés progressivement)
// import { AuthModule } from './auth/auth.module';
// import { UsersModule } from './users/users.module';
=======
// Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
>>>>>>> Stashed changes

@Module({
  imports: [
    // Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Connexion MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

<<<<<<< Updated upstream
    // Modules métier (à décommenter au fur et à mesure)
    // AuthModule,
    // UsersModule,
=======
    // Modules métier
    AuthModule,
    UsersModule,
>>>>>>> Stashed changes
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
