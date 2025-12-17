import { type FC } from 'react';
import { Box, Typography } from '@platform/ui';
import styles from './TestCssModule.module.css';

/**
 * Тестовый компонент для проверки работы CSS Modules
 * Демонстрирует использование CSS Modules вместе с MUI компонентами
 * и CSS переменными из @platform/ui
 */
export const TestCssModule: FC = () => {
  return (
    <Box className={styles.container}>
      <Typography variant="h6" className={styles.title}>
        Тест CSS Modules с CSS переменными
      </Typography>
      <Box className={styles.content}>
        <Typography className={styles.text}>
          Этот компонент использует CSS Modules для стилизации с CSS переменными
          из @platform/ui.
        </Typography>
        <Box className={styles.box}>
          <Typography className={styles.label}>
            Имя класса содержит префикс модуля (todo__)
          </Typography>
          <Typography className={styles.info}>
            CSS переменные: --mui-palette-primary-main, --spacing-md, и др.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
