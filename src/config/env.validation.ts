type EnvMap = Record<string, string | undefined>;

export function validateEnv(config: EnvMap): EnvMap {
  const required = [
    'APP_MODE',
    'DATABASE_ACCESS_MODE',
    'DATA_SOURCE',
    'DATABASE_URL',
    'JWT_SECRET',
  ];

  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  if (config.PORT && Number.isNaN(Number(config.PORT))) {
    throw new Error('PORT must be a number');
  }

  if (config.APP_MODE !== 'safe-dev') {
    throw new Error('APP_MODE must be safe-dev for this scaffold');
  }

  if (config.DATABASE_ACCESS_MODE !== 'readonly') {
    throw new Error('DATABASE_ACCESS_MODE must be readonly for this scaffold');
  }

  if (!['mock', 'prisma'].includes(config.DATA_SOURCE ?? '')) {
    throw new Error('DATA_SOURCE must be mock or prisma');
  }

  return config;
}
