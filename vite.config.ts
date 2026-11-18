import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { defineConfig } from 'vitest/config'
import { Category } from './src/domain/category.ts'
import { Day } from './src/domain/day.ts'

const { version } = JSON.parse(readFileSync('./package.json', 'utf8')) as { version: string }

/** Names the single page after the version it was built from (ADR 0001). */
function nameAfterVersion(): Plugin {
  return {
    name: 'stud-planner:name-after-version',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const page = bundle['index.html']
      if (page !== undefined) {
        page.fileName = `stud-planner-v${version}.html`
      }
    },
  }
}

/** Refuses to build unless `config/calendar.json` gives a day that ends after it starts. */
function checkCalendar(): Plugin {
  return {
    name: 'stud-planner:check-calendar',
    buildStart() {
      Day.from(JSON.parse(readFileSync('./config/calendar.json', 'utf8')))
    },
  }
}

/** Refuses to build unless `config/categories.json` lists categories, no two alike. */
function checkCategories(): Plugin {
  return {
    name: 'stud-planner:check-categories',
    buildStart() {
      Category.listedIn(JSON.parse(readFileSync('./config/categories.json', 'utf8')))
    },
  }
}

export default defineConfig({
  base: './',
  define: { __VERSION__: JSON.stringify(version) },
  plugins: [checkCalendar(), checkCategories(), viteSingleFile(), nameAfterVersion()],
  build: { assetsInlineLimit: Number.MAX_SAFE_INTEGER },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.fixture.ts', 'src/main.ts'],
      reporter: ['text', 'lcov'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
})
