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
  await access(new URL('../.env.example', import.meta.url));
  await access(new URL('../compose.with-db.yml', import.meta.url));
  await access(new URL('../compose.external-db.yml', import.meta.url));
  await access(new URL('../docker/entrypoint.sh', import.meta.url));

  const dockerfile = await readProjectFile('Dockerfile');
  const dockerignore = await readProjectFile('.dockerignore');
  const envExample = await readProjectFile('.env.example');
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

  assert.match(envExample, /^NUXT_SESSION_PASSWORD=/m);
  assert.match(envExample, /^DATABASE_URL=/m);
  assert.match(envExample, /^MEDIA_STORAGE_DIR=/m);
  assert.match(envExample, /^MYSQL_ROOT_PASSWORD=/m);
  assert.match(envExample, /^MYSQL_DATABASE=/m);
  assert.match(envExample, /^MYSQL_USER=/m);
  assert.match(envExample, /^MYSQL_PASSWORD=/m);
  assert.match(envExample, /^APT_MIRROR=/m);
  assert.match(envExample, /^NPM_REGISTRY=/m);
  assert.match(envExample, /^DOCKER_MEDIA_STORAGE_DIR=/m);
  assert.match(envExample, /^DATABASE_WAIT_MAX_ATTEMPTS=/m);
  assert.match(envExample, /^DATABASE_WAIT_SLEEP_SECONDS=/m);

  assert.match(composeWithDb, /image: mysql:8\.4/);
  assert.match(composeWithDb, /env_file:\s*\n\s+- \.env/);
  assert.match(composeWithDb, /depends_on:/);
  assert.match(composeWithDb, /condition: service_healthy/);
  assert.match(composeWithDb, /build:\s*[\s\S]*args:\s*[\s\S]*APT_MIRROR: \$\{APT_MIRROR:-\}/);
  assert.match(composeWithDb, /build:\s*[\s\S]*args:\s*[\s\S]*NPM_REGISTRY: \$\{NPM_REGISTRY:-\}/);
  assert.match(composeWithDb, /MYSQL_ROOT_PASSWORD: \$\{MYSQL_ROOT_PASSWORD\}/);
  assert.match(composeWithDb, /MYSQL_DATABASE: \$\{MYSQL_DATABASE\}/);
  assert.match(composeWithDb, /MYSQL_USER: \$\{MYSQL_USER\}/);
  assert.match(composeWithDb, /MYSQL_PASSWORD: \$\{MYSQL_PASSWORD\}/);
  assert.match(composeWithDb, /CMD-SHELL/);
  assert.match(composeWithDb, /\$\$\{?MYSQL_ROOT_PASSWORD\}?/);
  assert.match(composeWithDb, /DATABASE_URL: mysql:\/\/\$\{MYSQL_USER\}:\$\{MYSQL_PASSWORD\}@db:3306\/\$\{MYSQL_DATABASE\}\?allowPublicKeyRetrieval=true/);
  assert.match(composeWithDb, /MEDIA_STORAGE_DIR: \$\{DOCKER_MEDIA_STORAGE_DIR:-\/app\/storage\/media\}/);
  assert.match(composeWithDb, /blog-media:\$\{DOCKER_MEDIA_STORAGE_DIR:-\/app\/storage\/media\}/);
  assert.doesNotMatch(composeWithDb, /change-this-/);

  assert.match(composeExternalDb, /env_file:\s*\n\s+- \.env/);
  assert.match(composeExternalDb, /build:\s*[\s\S]*args:\s*[\s\S]*APT_MIRROR: \$\{APT_MIRROR:-\}/);
  assert.match(composeExternalDb, /build:\s*[\s\S]*args:\s*[\s\S]*NPM_REGISTRY: \$\{NPM_REGISTRY:-\}/);
  assert.match(composeExternalDb, /MEDIA_STORAGE_DIR: \$\{DOCKER_MEDIA_STORAGE_DIR:-\/app\/storage\/media\}/);
  assert.match(composeExternalDb, /blog-media:\$\{DOCKER_MEDIA_STORAGE_DIR:-\/app\/storage\/media\}/);
  assert.doesNotMatch(composeExternalDb, /change-this-/);
  assert.doesNotMatch(composeExternalDb, /db\.example\.com/);

  assert.match(entrypoint, /require_session_password/);
  assert.match(entrypoint, /require_env DATABASE_URL/);
  assert.match(entrypoint, /export MEDIA_STORAGE_DIR="\$\{MEDIA_STORAGE_DIR:-\/app\/storage\/media\}"/);
  assert.match(entrypoint, /DATABASE_WAIT_MAX_ATTEMPTS/);
  assert.match(entrypoint, /DATABASE_WAIT_SLEEP_SECONDS/);
  assert.match(entrypoint, /mkdir -p "\$MEDIA_STORAGE_DIR"/);
  assert.match(entrypoint, /await prisma\.\$queryRawUnsafe\('SELECT 1'\)/);
  assert.match(entrypoint, /pnpm exec prisma db push/);
  assert.match(entrypoint, /exec "\$@"/);
  assert.ok((entrypointStat.mode & constants.S_IXUSR) > 0);
});
