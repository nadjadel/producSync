import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

// Configuration
import configuration from './config/configuration';

// Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { QuotesModule } from './quotes/quotes.module';
import { ManufacturingOrdersModule } from './manufacturing-orders/manufacturing-orders.module';
import { DeliveryNotesModule } from './delivery-notes/delivery-notes.module';
import { InvoicesModule } from './invoices/invoices.module';
import { CountersModule } from './counters/counters.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { CreditNotesModule } from './credit-notes/credit-notes.module';
import { WorkstationsModule } from './workstations/workstations.module';

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

    // Modules métier
    AuthModule,
    UsersModule,
    CustomersModule,
    ProductsModule,
    OrdersModule,
    QuotesModule,
    ManufacturingOrdersModule,
    DeliveryNotesModule,
    InvoicesModule,
    CountersModule,
    SuppliersModule,
    CreditNotesModule,
    WorkstationsModule,
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
