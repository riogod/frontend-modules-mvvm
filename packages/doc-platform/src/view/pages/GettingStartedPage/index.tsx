import { type FC } from 'react';
import { Container, Typography, Paper } from '@platform/ui';
import { useTranslation } from 'react-i18next';
import { DocTOC } from '../../common';
import { RequirementsSection } from './components/RequirementsSection';
import { InstallationSection } from './components/InstallationSection';
import { LaunchingSection } from './components/LaunchingSection';
import { FirstConfigSection } from './components/FirstConfigSection';
import { ServicesSection } from './components/ServicesSection';
import { NextStepsSection } from './components/NextStepsSection';
import { TroubleshootingSection } from './components/TroubleshootingSection';
import { PreviewSection } from './components/PreviewSection';
import { CommandsSection } from './components/CommandsSection';

/**
 * Страница документации "Начало работы".
 * Содержит руководство по установке, настройке и запуску проекта,
 * а также информацию о структуре сервисов и устранении проблем.
 *
 * @component
 */
const GettingStartedPage: FC = () => {
  const { t } = useTranslation('doc-platform');

  return (
    <Container maxWidth={false} sx={{ padding: 0 }}>
      <Typography variant="h4" gutterBottom>
        {t('menu.getting-started')}
      </Typography>

      <Paper sx={(theme) => ({ width: '100%', p: theme.spacing(6) })}>
        <Typography variant="body1" paragraph>
          Это руководство поможет вам быстро начать работу с Modular Frontend
          Platform (MFP). Вы узнаете, как установить зависимости, запустить
          проект и начать разработку.
        </Typography>

        <DocTOC
          items={[
            { id: 'требования', title: 'Требования' },
            { id: 'установка', title: 'Установка' },
            { id: 'запуск-проекта', title: 'Запуск проекта' },
            { id: 'первый-запуск', title: 'Первый запуск' },
            {
              id: 'структура-запущенных-сервисов',
              title: 'Структура запущенных сервисов',
            },
            { id: 'что-дальше', title: 'Что дальше?' },
            { id: 'устранение-проблем', title: 'Устранение проблем' },
            { id: 'режим-preview', title: 'Режим Preview' },
            { id: 'полезные-команды', title: 'Полезные команды' },
          ]}
        />

        <div id="требования">
          <RequirementsSection />
        </div>

        <div id="установка">
          <InstallationSection />
        </div>

        <div id="запуск-проекта">
          <LaunchingSection />
        </div>

        <div id="первый-запуск">
          <FirstConfigSection />
        </div>

        <div id="структура-запущенных-сервисов">
          <ServicesSection />
        </div>

        <div id="что-дальше">
          <NextStepsSection />
        </div>

        <div id="устранение-проблем">
          <TroubleshootingSection />
        </div>

        <div id="режим-preview">
          <PreviewSection />
        </div>

        <div id="полезные-команды">
          <CommandsSection />
        </div>
      </Paper>
    </Container>
  );
};

export default GettingStartedPage;
