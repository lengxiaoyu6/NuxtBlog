import test from 'node:test';
import assert from 'node:assert/strict';
import { constants } from 'node:fs';
import { access, readFile, stat } from 'node:fs/promises';

async function readProjectFile(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

test('Docker 部署资产文件已经落仓并具备关键配置', async () => {
  await access(new URL('../Dockerfile', import.meta.url));
  await access(new URL('../.dockerignore', import.meta.url));
  await access(new URL('../compose.with-db.yml', import.meta.url));
  await access(new URL('../compose.external-db.yml', import.meta.url));
  await access(new URL('../docker/entrypoint.sh', import.meta.url));

  const dockerfile = await readProjectFile('Dockerfile');
  const dockerignore = await readProjectFile('.dockerignore');
  const composeWithDb = await readProjectFile('compose.with-db.yml');
  const composeExternalDb = await readProjectFile('compose.external-db.yml');
  const entrypoint = await readProjectFile('docker/entrypoint.sh');
  const entrypointStat = await stat(new URL('../docker/entrypoint.sh', import.meta.url));

  assert.match(dockerfile, /ARG APT_MIRROR/);
  assert.match(dockerfile, /ARG NPM_REGISTRY/);
  assert.match(dockerfile, /if \[ -n "\$APT_MIRROR" \]/);
  assert.match(dockerfile, /sed -i "s\|http:\/\/deb\.debian\.org\|\$APT_MIRROR\|g" \/etc\/apt\/sources\.list\.d\/debian\.sources/);
  assert.match(dockerfile, /if \[ -n "\$NPM_REGISTRY" \]/);
  assert.match(dockerfile, /COREPACK_NPM_REGISTRY="\$NPM_REGISTRY"/);
  assert.match(dockerfile, /npm config set registry "\$NPM_REGISTRY"/);
  assert.match(dockerfile, /pnpm config set registry "\$NPM_REGISTRY"/);
  assert.match(dockerfile, /WORKDIR \/app/);
  assert.match(dockerfile, /COPY --from=build \/app\/docker \.\/docker/);
  assert.match(dockerfile, /RUN chmod \+x \.\/docker\/entrypoint\.sh/);
  assert.match(dockerfile, /ENTRYPOINT \["\.\/docker\/entrypoint\.sh"\]/);
  assert.match(dockerfile, /CMD \["node", "\.output\/server\/index\.mjs"\]/);

  assert.match(dockerignore, /^\.git$/m);
  assert.match(dockerignore, /^docs$/m);
  assert.match(dockerignore, /^node_modules$/m);
  assert.match(dockerignore, /^\.env\.\*$/m);

  assert.match(composeWithDb, /image: mysql:8\.4/);
  assert.match(composeWithDb, /depends_on:/);
  assert.match(composeWithDb, /condition: service_healthy/);
  assert.match(composeWithDb, /build:\s*[\s\S]*args:\s*[\s\S]*APT_MIRROR: ""/);
  assert.match(composeWithDb, /build:\s*[\s\S]*args:\s*[\s\S]*NPM_REGISTRY: ""/);
  assert.match(composeWithDb, /DATABASE_URL: mysql:\/\/nuxtblog:change-this-db-password@db:3306\/nuxt-blog\?allowPublicKeyRetrieval=true/);
  assert.match(composeWithDb, /blog-media:\/app\/storage\/media/);
  assert.doesNotMatch(composeWithDb, /^\s+MEDIA_STORAGE_DIR:/m);

  assert.match(composeExternalDb, /build:\s*[\s\S]*args:\s*[\s\S]*APT_MIRROR: ""/);
  assert.match(composeExternalDb, /build:\s*[\s\S]*args:\s*[\s\S]*NPM_REGISTRY: ""/);
  assert.match(composeExternalDb, /DATABASE_URL: mysql:\/\/db-user:db-password@db\.example\.com:3306\/nuxt-blog/);
  assert.match(composeExternalDb, /blog-media:\/app\/storage\/media/);
  assert.doesNotMatch(composeExternalDb, /^\s+MEDIA_STORAGE_DIR:/m);

  assert.match(entrypoint, /require_env NUXT_SESSION_PASSWORD/);
  assert.match(entrypoint, /require_env DATABASE_URL/);
  assert.match(entrypoint, /export MEDIA_STORAGE_DIR="\$\{MEDIA_STORAGE_DIR:-\/app\/storage\/media\}"/);
  assert.match(entrypoint, /mkdir -p "\$MEDIA_STORAGE_DIR"/);
  assert.match(entrypoint, /await prisma\.\$queryRawUnsafe\('SELECT 1'\)/);
  assert.match(entrypoint, /pnpm exec prisma db push/);
  assert.match(entrypoint, /exec "\$@"/);
  assert.ok((entrypointStat.mode & constants.S_IXUSR) > 0);
});
