const { execSync } = require('child_process')
const { resolve } = require('path')
const { strict: assert } = require('assert')
const { readFileSync, readdirSync, existsSync, rmSync } = require('fs')

const ROOT = resolve(__dirname, '..')
const SITE_DIR = resolve(ROOT, '_site')

// A distinctive string from an existing post, used to verify content made it through the build.
const CONTENT_MARKER = 'JavaScript中识别native方法'

function collectHtmlFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectHtmlFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(fullPath)
    }
  }
  return files
}

function cleanSite() {
  if (existsSync(SITE_DIR)) {
    rmSync(SITE_DIR, { recursive: true, force: true })
  }
}

function runHexoGenerate() {
  execSync('npx hexo generate', {
    stdio: 'pipe',
    cwd: ROOT,
    timeout: 120_000,
  })
}

function assertSiteExists() {
  assert(existsSync(SITE_DIR), '_site/ directory should exist after build')
}

function assertSiteNotEmpty() {
  const entries = readdirSync(SITE_DIR)
  assert(entries.length > 0, '_site/ directory should not be empty')
}

function assertIndexHtmlExists() {
  assert(existsSync(resolve(SITE_DIR, 'index.html')), '_site/index.html should exist')
}

function assertContentPresent() {
  const htmlFiles = collectHtmlFiles(SITE_DIR)
  assert(htmlFiles.length > 0, 'Should find at least one .html file in _site/')

  let found = false
  for (const file of htmlFiles) {
    const content = readFileSync(file, 'utf-8')
    if (content.includes(CONTENT_MARKER)) {
      found = true
      break
    }
  }
  assert(found, `Build output should contain content matching "${CONTENT_MARKER}"`)
}

// --- Main ---

console.log('[smoke] cleaning previous build...')
cleanSite()

console.log('[smoke] running hexo generate...')
runHexoGenerate()

console.log('[smoke] asserting build output...')
assertSiteExists()
assertSiteNotEmpty()
assertIndexHtmlExists()
assertContentPresent()

console.log('[smoke] all assertions passed')
