import { type FC } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Link,
} from '@platform/ui';
import { useTranslation } from 'react-i18next';

/**
 * Главная страница документации платформы.
 * Содержит обзор платформы и навигацию по разделам документации.
 *
 * @component
 */
const HomePage: FC = () => {
  const { t } = useTranslation('doc-platform');

  const sections = [
    {
      title: 'Архитектура',
      path: '/doc-platform/architecture',
      description: 'Обзор архитектуры платформы, принципы чистой архитектуры',
    },
    {
      title: 'Начало работы',
      path: '/doc-platform/getting-started',
      description: 'Установка, настройка и запуск проекта',
    },
    {
      title: 'Структура проекта',
      path: '/doc-platform/project-structure',
      description: 'Описание структуры монорепозитория и модулей',
    },
    {
      title: 'Bootstrap',
      path: '/doc-platform/bootstrap',
      description: 'Процесс инициализации и загрузки модулей',
    },
    {
      title: 'Модули',
      path: '/doc-platform/modules',
      description:
        'MVVM паттерн, создание модулей, межмодульное взаимодействие',
    },
    {
      title: 'Библиотеки',
      path: '/doc-platform/libs',
      description: 'Core, Common, UI, Share библиотеки платформы',
    },
    {
      title: 'Механики',
      path: '/doc-platform/mechanics',
      description: 'Feature flags, Permissions, Server Parameters',
    },
    {
      title: 'Инструменты',
      path: '/doc-platform/tools',
      description: 'Build, Launcher, Linting, Testing',
    },
    {
      title: 'How-to',
      path: '/doc-platform/how-to',
      description: 'Практические руководства и решения',
    },
    {
      title: 'Деплой',
      path: '/doc-platform/deployment',
      description: 'CI/CD и production конфигурация',
    },
  ];

  return (
    <Container maxWidth={false} sx={{ padding: 0 }}>
      <Typography variant="h4" gutterBottom>
        {t('title')}
      </Typography>
      <Typography variant="body1" paragraph>
        Добро пожаловать в документацию платформы Modular Frontend Platform
        (MFP).
      </Typography>
      <Typography variant="body1" paragraph>
        MFP — это модульная платформа для создания масштабируемых
        фронтенд-приложений с использованием React, TypeScript, MobX и Module
        Federation.
      </Typography>

      <Box
        sx={(theme) => ({
          mt: theme.spacing(2),
          display: 'flex',
          flexWrap: 'wrap',
          gap: theme.spacing(2),
        })}
      >
        {sections.map((section) => (
          <Box key={section.path} sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Link href={section.path} underline="hover">
                    {section.title}
                  </Link>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {section.description}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </Container>
  );
};

export default HomePage;
