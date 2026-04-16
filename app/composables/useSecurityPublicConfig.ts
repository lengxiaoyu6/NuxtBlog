import type { SecurityPublicConfig } from '~~/shared/types/security';

interface FetchSecurityPublicConfigOptions {
  force?: boolean;
}

const DEFAULT_SECURITY_PUBLIC_CONFIG: SecurityPublicConfig = {
  turnstileSiteKey: '',
  loginCaptchaEnabled: false,
  commentCaptchaEnabled: false,
  guestbookCaptchaEnabled: false,
  linkApplicationCaptchaEnabled: false,
};

function cloneSecurityPublicConfig(config: SecurityPublicConfig): SecurityPublicConfig {
  return {
    turnstileSiteKey: config.turnstileSiteKey,
    loginCaptchaEnabled: config.loginCaptchaEnabled,
    commentCaptchaEnabled: config.commentCaptchaEnabled,
    guestbookCaptchaEnabled: config.guestbookCaptchaEnabled,
    linkApplicationCaptchaEnabled: config.linkApplicationCaptchaEnabled,
  };
}

export function useSecurityPublicConfig() {
  const securityConfig = useState<SecurityPublicConfig>(
    'security-public-config',
    () => cloneSecurityPublicConfig(DEFAULT_SECURITY_PUBLIC_CONFIG),
  );
  const ready = useState('security-public-config-ready', () => false);

  async function fetchSecurityPublicConfig(options: FetchSecurityPublicConfigOptions = {}) {
    if (!options.force && ready.value) {
      return securityConfig.value;
    }

    try {
      const response = await $fetch<SecurityPublicConfig>('/api/security/public-config');
      securityConfig.value = cloneSecurityPublicConfig(response);
    }
    catch {
      securityConfig.value = cloneSecurityPublicConfig(DEFAULT_SECURITY_PUBLIC_CONFIG);
    }

    ready.value = true;
    return securityConfig.value;
  }

  return {
    securityConfig,
    ready,
    fetchSecurityPublicConfig,
  };
}
