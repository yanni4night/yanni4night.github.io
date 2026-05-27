const { execSync } = require('child_process')
const { resolve } = require('path')

try {
  execSync('npx hexo generate', {
    stdio: 'pipe',
    cwd: resolve(__dirname, '..'),
  })
  console.log('hexo generate succeeded')
  process.exit(0)
} catch (err) {
  console.error('hexo generate failed:', err.stderr?.toString() || err.message)
  process.exit(1)
}
