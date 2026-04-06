#!/usr/bin/env bash
# Skip Vercel deploys when only docs/tests/CI configs change.
# Exit 0 = skip build, exit 1 = proceed with build.
set -e

git diff HEAD^ HEAD --quiet -- \
  ':(exclude)README.md' \
  ':(exclude)TODO.md' \
  ':(exclude)AUDIT.md' \
  ':(exclude)GDPR-ANALYSIS.md' \
  ':(exclude)CLAUDE.md' \
  ':(exclude)apps/web/app/__tests__' \
  ':(exclude)apps/web/e2e' \
  ':(exclude)apps/web/jest.config.ts' \
  ':(exclude)apps/web/jest.setup.ts' \
  ':(exclude)apps/web/playwright.config.ts' \
  ':(exclude).github' \
  ':(exclude).husky' \
  ':(exclude).gitignore' \
  ':(exclude)apps/hrm'
