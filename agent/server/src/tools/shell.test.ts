import { describe, it, expect, beforeAll } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ShellRunner } from './shell.ts';

describe('ShellRunner whitelist', () => {
  const ws = mkdtempSync(join(tmpdir(), 'ws-'));
  const runner = new ShellRunner(ws);

  beforeAll(() => {
    writeFileSync(join(ws, 'hello.js'), `console.log('hi')`);
  });

  describe('rejects non-whitelisted commands', () => {
    it('rejects node -e', async () => {
      const r = await runner.run('node', ['-e', 'process.exit(0)']);
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/not whitelisted/);
    });

    it('rejects node -p', async () => {
      const r = await runner.run('node', ['-p', '1+1']);
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/not whitelisted/);
    });

    it('rejects node --eval', async () => {
      const r = await runner.run('node', ['--eval', 'process.exit(0)']);
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/not whitelisted/);
    });

    it('rejects node --print', async () => {
      const r = await runner.run('node', ['--print', '1+1']);
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/not whitelisted/);
    });

    it('rejects bash', async () => {
      const r = await runner.run('bash', ['-c', 'echo hi']);
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/not whitelisted/);
    });

    it('rejects sh', async () => {
      const r = await runner.run('sh', ['-c', 'echo hi']);
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/not whitelisted/);
    });

    it('rejects rm', async () => {
      const r = await runner.run('rm', ['-rf', '/tmp/anything']);
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/not whitelisted/);
    });

    it('rejects npx prisma (no longer whitelisted)', async () => {
      const r = await runner.run('npx', ['prisma', 'generate']);
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/not whitelisted/);
    });

    it('rejects unknown pnpm script (e.g. publish)', async () => {
      const r = await runner.run('pnpm', ['--dir', ws, 'publish']);
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/not whitelisted/);
    });
  });

  describe('blocks parent traversal', () => {
    it('rejects .. as a bare arg', async () => {
      const r = await runner.run('node', ['..']);
      expect(r.ok).toBe(false);
      // first the rule may not match (no .js extension) — either rejection is fine
      expect(r.ok).toBe(false);
    });

    it('rejects ../ prefix', async () => {
      const r = await runner.run('node', ['../escape.js']);
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/traversal|whitelist/i);
    });

    it('rejects /../ embedded', async () => {
      const r = await runner.run('node', ['sub/../escape.js']);
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/traversal|whitelist/i);
    });
  });

  describe('blocks absolute paths outside workspace', () => {
    it('rejects an absolute path outside ws', async () => {
      const outside = mkdtempSync(join(tmpdir(), 'outside-'));
      writeFileSync(join(outside, 'evil.js'), '');
      const r = await runner.run('node', [join(outside, 'evil.js')]);
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/outside workspace/);
    });

    it('rejects pnpm --dir pointing outside workspace', async () => {
      const outside = mkdtempSync(join(tmpdir(), 'outside-'));
      const r = await runner.run('pnpm', ['--dir', outside, 'build']);
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/outside workspace/);
    });
  });

  describe('accepts whitelisted commands', () => {
    it('accepts npx ajv-cli@5 (rule match — may fail to resolve binary, which is fine)', async () => {
      const r = await runner.run('npx', ['ajv-cli@5', '--help']);
      expect(r.error ?? '').not.toMatch(/not whitelisted/);
    });

    it('accepts node hello.js inside workspace', async () => {
      const r = await runner.run('node', ['hello.js']);
      expect(r.error ?? '').not.toMatch(/not whitelisted/);
      expect(r.error ?? '').not.toMatch(/outside workspace/);
    });

    it('accepts pnpm --dir <ws> build (rule match — exec may fail with exit code, that is OK)', async () => {
      const r = await runner.run('pnpm', ['--dir', ws, 'build']);
      expect(r.error ?? '').not.toMatch(/not whitelisted/);
      expect(r.error ?? '').not.toMatch(/outside workspace/);
    });
  });
});
