import { createRequire } from 'node:module';

export async function resolve(specifier, context, nextResolve) {
  return nextResolve(specifier);
}

export async function load(url, context, nextLoad) {
  if (url.includes('chord-symbol')) {
    const require = createRequire(import.meta.url);
    return {
      'format': 'module',
      'source': '',
      'shortCircuit': true
    };
  }

  return nextLoad(url, context);
}
