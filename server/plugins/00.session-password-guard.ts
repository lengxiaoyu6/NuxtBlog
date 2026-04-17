import { assertValidSessionPassword } from '../../shared/utils/session-password';

export default defineNitroPlugin(() => {
  const runtimeConfig = useRuntimeConfig();
  const normalizedPassword = assertValidSessionPassword(process.env.NUXT_SESSION_PASSWORD || runtimeConfig.session.password);
  process.env.NUXT_SESSION_PASSWORD = normalizedPassword;
});
