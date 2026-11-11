export const config = {
 port: Number(process.env.PORT || 8080), nodeEnv: process.env.NODE_ENV || 'development',
 databaseUrl: process.env.DATABASE_URL || '', webOrigin: process.env.WEB_ORIGIN || '',
 telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
 sessionSecret: process.env.SESSION_SECRET || '',
 sessionMaxAgeSeconds: Number(process.env.SESSION_MAX_AGE_SECONDS || 86400),
 telegramAuthMaxAgeSeconds: Number(process.env.TELEGRAM_AUTH_MAX_AGE_SECONDS || 86400),
 allowDevAuth: process.env.ALLOW_DEV_AUTH === 'true',
 startingBudgetUzs: BigInt(process.env.STARTING_BUDGET_UZS || '0'),
 startingSquadSize: Math.max(11, Math.min(25, Number(process.env.STARTING_SQUAD_SIZE || 18))),
 matchHomeAdvantage: Math.max(0, Math.min(0.15, Number(process.env.MATCH_HOME_ADVANTAGE || 0.06)))
};
if (config.startingBudgetUzs < 0n) throw new Error('STARTING_BUDGET_UZS cannot be negative');
if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) throw new Error('PORT is invalid');
