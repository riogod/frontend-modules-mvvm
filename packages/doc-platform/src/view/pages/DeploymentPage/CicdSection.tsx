import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocList, DocNote } from '../../common';

export const CicdSection: FC = () => (
  <DocSection title="CI/CD">
    <DocSection title="Pipeline">
      <p>Типичный pipeline для MFP:</p>
      <DocCodeBlock
        code={`1. Lint      - Проверка кода через ESLint
2. Test      - Запуск тестов через Vitest
3. Build     - Сборка модулей и хоста
4. Deploy    - Деплой на сервер`}
        language="text"
      />
    </DocSection>
    <DocSection title="Пример GitHub Actions">
      <DocCodeBlock
        code={`name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build:all

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/`}
        language="yaml"
      />
    </DocSection>
    <DocSection title="Lint Stage">
      <DocCodeBlock
        code={`- name: Lint
  run: npm run lint

# Или с параметрами
- name: Lint modules
  run: npm run lint:modules -- --all --parallel

- name: Lint with fix
  run: npm run lint -- --fix`}
        language="yaml"
      />
    </DocSection>
    <DocSection title="Test Stage">
      <DocCodeBlock
        code={`- name: Test
  run: npm test -- --coverage

# С отчетом
- name: Test with coverage
  run: npm test -- --coverage --reporter=json

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json`}
        language="yaml"
      />
    </DocSection>
    <DocSection title="Build Stage">
      <DocCodeBlock
        code={`- name: Build
  run: npm run build:all

# С анализом бандла
- name: Build with analyze
  run: npm run build:all && npm run analyze

# Или отдельно
- name: Build host
  run: npm run build:host

- name: Build modules
  run: npm run build:modules -- --all --parallel`}
        language="yaml"
      />
    </DocSection>
    <DocSection title="Deploy Stage">
      <DocCodeBlock
        code={`- name: Deploy
  run: |
    npm run deploy -- --env=production
  env:
    DEPLOY_KEY: \${{ secrets.DEPLOY_KEY }}
    DEPLOY_URL: \${{ secrets.DEPLOY_URL }}

# Или через rsync
- name: Deploy via rsync
  run: |
    rsync -avz --delete dist/ user@server:/var/www/app/`}
        language="yaml"
      />
    </DocSection>
    <DocSection title="Environment Variables">
      <DocCodeBlock
        code={`env:
  VITE_API_URL: https://api.example.com
  VITE_APP_PREFIX: /my-app
  LOG_LEVEL: ERROR

# Из secrets
env:
  API_KEY: \${{ secrets.API_KEY }}
  AUTH_TOKEN: \${{ secrets.AUTH_TOKEN }}`}
        language="yaml"
      />
    </DocSection>
    <DocSection title="Кэширование зависимостей">
      <DocCodeBlock
        code={`- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: '18'
    cache: 'npm' # ✅ Кэширование npm

# Или кэширование через actions/cache
- name: Cache dependencies
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: \${{ runner.os }}-node-\${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      \${{ runner.os }}-node-`}
        language="yaml"
      />
    </DocSection>
    <DocNote type="info" title="Советы">
      <DocList
        items={[
          'Используйте кэширование для ускорения сборки',
          'Параллелизуйте lint и test',
          'Разбейте pipeline на stages',
          'Используйте артефакты для хранения dist',
          'Настройте уведомления о результатах',
        ]}
      />
    </DocNote>
  </DocSection>
);
