import { publish } from '@baicie/release'

publish({
  defaultPackage: 'worker',
  packageManager: 'pnpm',
  getPkgDir: () => '.',
})
