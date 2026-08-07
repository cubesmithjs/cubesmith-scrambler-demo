import type { NextConfig } from 'next';

/**
 * Two builds out of one source tree.
 *
 * The default build is an ordinary Next server app: the Route Handler runs,
 * both call sites work, and it deploys to Vercel with no configuration.
 *
 * `STATIC_EXPORT=1` instead produces a fully static site for GitHub Pages,
 * which has no compute of any kind. That build serves browser mode only — the
 * workflow deletes `src/app/api` first, because a dynamic Route Handler cannot
 * be exported and the build fails while one is present.
 *
 * Note what is *not* here. `@cubesmith/scrambler` is ESM-only, dependency-free,
 * and touches no DOM or Node built-in, so it needs no transpile step and no
 * bundler workaround in either build. In particular, never add anything that
 * marks the package side-effect free: it declares `sideEffects: true` on
 * purpose, because importing it runs the puzzle registration calls. Tree-shake
 * those away and you get an empty registry where every event throws.
 */
const isStaticExport = process.env.STATIC_EXPORT === '1';

/** A GitHub project site is served from /<repo>, not from the domain root. */
const basePath = '/cubesmith-scrambler-demo';

const nextConfig: NextConfig = isStaticExport
  ? {
      output: 'export',
      basePath,
      assetPrefix: basePath,
      // Emits out/code/index.html rather than out/code.html. GitHub Pages
      // serves either, but the directory form is what every static host
      // resolves without configuration.
      trailingSlash: true,
      env: { NEXT_PUBLIC_STATIC_EXPORT: '1' },
    }
  : {};

export default nextConfig;
