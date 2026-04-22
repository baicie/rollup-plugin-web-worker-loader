import { release } from '@baicie/release'

release({
  repo: 'baicie',
  packages: ['worker'],
  toTag: (pkg, version) => `${pkg}@${version}`,
  getPkgDir: () => '.',
})
