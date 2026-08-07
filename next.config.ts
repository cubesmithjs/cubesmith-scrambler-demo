import type { NextConfig } from 'next';

/**
 * Deliberately empty.
 *
 * `@cubesmith/scrambler` is ESM-only, dependency-free, and touches no DOM or
 * Node built-in, so it needs no transpile step, no `serverExternalPackages`
 * entry, and no bundler workaround in either the server or the client graph.
 *
 * In particular, do not add anything that marks the package side-effect-free.
 * It declares `sideEffects: true` on purpose: importing it runs the puzzle
 * registration calls, and a tree-shake that drops those leaves you with an
 * empty registry where every event throws `UnimplementedEventError`.
 */
const nextConfig: NextConfig = {};

export default nextConfig;
