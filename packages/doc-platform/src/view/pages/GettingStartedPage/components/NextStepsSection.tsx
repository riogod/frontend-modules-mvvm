import { type FC } from 'react';
import { Typography, Link } from '@platform/ui';
import { DocSection, DocList } from '../../../common';

export const NextStepsSection: FC = () => (
  <DocSection title="Что дальше?" sx={(theme) => ({ scrollMarginTop: theme.spacing(2) })}>
    <Typography variant="body1" paragraph>
      После успешного запуска проекта:
    </Typography>
    <DocList
      items={[
        <>
          Изучите архитектуру: прочитайте{' '}
          <Link href="/doc-platform/architecture" underline="hover">
            Архитектура
          </Link>{' '}
          для понимания основных принципов
        </>,
        <>
          Создайте модуль: следуйте руководству{' '}
          <Link href="/doc-platform/modules" underline="hover">
            Модули
          </Link>
        </>,
        <>
          Изучите MVVM: ознакомьтесь с{' '}
          <Link href="/doc-platform/modules" underline="hover">
            MVVM паттерном
          </Link>
        </>,
        <>
          Настройте разработку: см.{' '}
          <Link href="/doc-platform/tools" underline="hover">
            Лаунчер
          </Link>{' '}
          для деталей о режимах разработки
        </>,
      ]}
    />
  </DocSection>
);
