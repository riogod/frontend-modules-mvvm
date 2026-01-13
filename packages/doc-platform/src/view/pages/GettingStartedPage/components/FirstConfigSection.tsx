import { type FC } from 'react';
import { Typography } from '@platform/ui';
import { DocSection, DocSteps, DocNote, DocList } from '../../../common';

export const FirstConfigSection: FC = () => (
  <DocSection title="Первый запуск" sx={(theme) => ({ scrollMarginTop: theme.spacing(2) })}>
    <Typography variant="h6" gutterBottom>
      Создание конфигурации
    </Typography>
    <Typography variant="body2" paragraph>
      При первом запуске через npm start вам будет предложено создать конфигурацию для
      разработки. Следуйте инструкциям:
    </Typography>

    <DocSteps
      steps={[
        {
          title: 'Выберите модули',
          content: (
            <Typography variant="body2">
              Укажите, какие модули использовать (LOCAL/REMOTE/Пропустить)
            </Typography>
          ),
        },
        {
          title: 'Настройте параметры конфигурации',
          content: (
            <DocList
              items={[
                'Уровень логирования (INFO рекомендуется для начала)',
                'Использование локальных моков (рекомендуется включить для разработки)',
                'API URL (оставьте пустым, если используете моки)',
              ]}
            />
          ),
        },
        {
          title: 'Введите имя конфигурации',
          content: (
            <Typography variant="body2">Например, "Development"</Typography>
          ),
        },
        {
          title: 'Добавьте описание (опционально)',
          content: <Typography variant="body2">Необязательный шаг</Typography>,
        },
      ]}
    />

    <Typography variant="h6" gutterBottom sx={(theme) => ({ mt: theme.spacing(3) })}>
      Рекомендуемая первая конфигурация
    </Typography>
    <DocNote type="info" title="Рекомендация">
      <Typography variant="body2" paragraph>
        Для начала работы рекомендуется создать конфигурацию со следующими
        настройками:
      </Typography>
      <DocList
        items={[
          'Модули: Все модули из packages/ установлены как LOCAL',
          'Уровень логирования: INFO',
          'Локальные моки: Включены',
          'API URL: Пустой',
        ]}
      />
      <Typography variant="body2" sx={(theme) => ({ mt: theme.spacing(1) })}>
        Это позволит работать с приложением без необходимости настройки удаленного
        API.
      </Typography>
    </DocNote>
  </DocSection>
);
