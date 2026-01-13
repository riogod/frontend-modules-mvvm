import { type FC } from 'react';
import { DocSection, DocList } from '../../../common';

export const NextStepsSection: FC = () => (
  <DocSection title="Что дальше?">
    <p>После успешного запуска проекта:</p>
    <DocList
      items={[
        <>
          Изучите архитектуру: прочитайте{' '}
          <a href="/doc-platform/architecture">Архитектура</a> для понимания
          основных принципов
        </>,
        <>
          Создайте модуль: следуйте руководству{' '}
          <a href="/doc-platform/modules">Модули</a>
        </>,
        <>
          Изучите MVVM: ознакомьтесь с{' '}
          <a href="/doc-platform/modules">MVVM паттерном</a>
        </>,
        <>
          Настройте разработку: см. <a href="/doc-platform/tools">Лаунчер</a>{' '}
          для деталей о режимах разработки
        </>,
      ]}
    />
  </DocSection>
);
