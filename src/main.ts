import 'reflect-metadata';

import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

type ReadonlyGuardRequest = {
  method: string;
  url?: string;
};

type ReadonlyGuardResponse = {
  status: (code: number) => {
    json: (payload: { message: string }) => void;
  };
};

type ReadonlyGuardNext = () => void;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  app.use(
    (
      req: ReadonlyGuardRequest,
      res: ReadonlyGuardResponse,
      next: ReadonlyGuardNext,
    ) => {
      const isReadonlyMode = process.env.DATABASE_ACCESS_MODE === 'readonly';
      const isReadMethod = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
      const isAuthLogin = req.url?.includes('/auth/login') ?? false;

      if (isReadonlyMode && !isReadMethod && !isAuthLogin) {
        res.status(403).json({
          message: 'Write operations are blocked in readonly mode.',
        });
        return;
      }

      next();
    },
  );

  app.setGlobalPrefix('api', {
    exclude: [{ path: 'admin', method: RequestMethod.GET }],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3000);

  await app.listen(port);
  console.log(`Wujibackstage listening on port ${port}`);
}

void bootstrap();
