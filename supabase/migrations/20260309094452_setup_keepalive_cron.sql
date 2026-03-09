CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'keepalive-ping') THEN
    PERFORM cron.unschedule('keepalive-ping');
  END IF;
END $$;

SELECT cron.schedule(
  'keepalive-ping',
  '0 6 */4 * *',
  $$SELECT count(*) FROM operadoras LIMIT 1$$
);
