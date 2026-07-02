# Volume 14: Deployment

## Purpose

Define development, staging, production, environment variables, build, monitoring, rollback, and scaling.

## Deployment Rule

Production deploys must come from `main` and complete with a successful build. Secrets are configured through Vercel or the chosen deployment platform.

## Verification Minimum

- lint or targeted type check
- production build
- affected route HTTP check
- affected API check
- git status clean before final push/deploy report

## Rollback

Every production deploy should preserve a previous deployment URL and commit SHA for fast rollback.

