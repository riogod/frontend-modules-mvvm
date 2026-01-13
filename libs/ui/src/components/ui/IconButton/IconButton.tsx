import { type FC, type ReactNode } from 'react';
import { styled, useTheme, type Theme } from '@mui/material/styles';
import { Box } from '@mui/material';

export interface IconButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?:
    | 'inherit'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning';
  title?: string;
  'aria-label'?: string;
}

/**
 * Получает цвета для теней в зависимости от темы
 */
const getShadowColors = (theme: Theme) => {
  const isDark = theme.palette.mode === 'dark';

  if (isDark) {
    return {
      light: 'rgba(255, 255, 255, 0.15)',
      shadow: 'rgba(0, 0, 0, 0.8)',
      insetShadow: 'rgba(0, 0, 0, 0.6)',
      insetLight: 'rgba(255, 255, 255, 0.08)',
    };
  }

  return {
    light: 'rgba(255, 255, 255, 0.6)',
    shadow: 'rgba(0, 0, 0, 0.15)',
    insetShadow: 'rgba(0, 0, 0, 0.15)',
    insetLight: 'rgba(255, 255, 255, 0.6)',
  };
};

/**
 * Получает размеры кнопки в зависимости от размера
 */
const getSizeStyles = (size: 'small' | 'medium' | 'large') => {
  const sizes = {
    small: {
      width: '32px',
      height: '32px',
      borderRadius: '12px',
      iconSize: '22px',
    },
    medium: {
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      iconSize: '18px',
    },
    large: {
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      iconSize: '22px',
    },
  };

  return sizes[size];
};

/**
 * Внешний контейнер кнопки с эффектом tile
 */
const TileButtonContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'size' && prop !== 'disabled',
})<{ size: 'small' | 'medium' | 'large'; disabled: boolean }>(({
  theme,
  size,
  disabled,
}) => {
  const shadowColors = getShadowColors(theme);
  const sizeStyles = getSizeStyles(size);
  const height = 1; // Множитель для высоты эффекта

  return {
    position: 'relative',
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: sizeStyles.width,
    height: sizeStyles.height,
    borderRadius: sizeStyles.borderRadius,
    backgroundColor: 'transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'box-shadow 0.15s 0.15s ease-in',
    boxShadow: disabled
      ? 'none'
      : `${shadowColors.shadow} calc(0.33rem * ${height}) calc(0.33rem * ${height}) 0.6rem`,
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: sizeStyles.borderRadius,
      pointerEvents: 'none',
      transition: 'box-shadow 0.15s 0.15s ease-in',
      boxShadow: disabled
        ? 'none'
        : `${shadowColors.light} calc(-0.33rem * ${height}) calc(-0.33rem * ${height}) 0.6rem`,
    },
    ...(!disabled && {
      '&:hover': {
        boxShadow: `${shadowColors.shadow} 0 0 0`,
        transition: 'box-shadow 0.15s ease-out',
        '&::before': {
          boxShadow: `${shadowColors.light} 0 0 0`,
          transition: 'box-shadow 0.15s ease-out',
        },
        '& > div': {
          boxShadow: `inset ${shadowColors.insetShadow} calc(0.25rem * ${height}) calc(0.25rem * ${height}) 0.6rem`,
          transition: 'box-shadow 0.15s 0.15s ease-out',
          '&::before': {
            boxShadow: `inset ${shadowColors.insetLight} calc(-0.25rem * ${height}) calc(-0.25rem * ${height}) 0.6rem`,
            transition: 'box-shadow 0.15s 0.15s ease-out',
          },
        },
        '& > div > span': {
          transform: 'translateY(0.1516rem)',
        },
      },
      '&:active': {
        boxShadow: `inset ${shadowColors.insetShadow} calc(0.25rem * ${height}) calc(0.25rem * ${height}) 0.6rem`,
        '&::before': {
          boxShadow: `inset ${shadowColors.insetLight} calc(-0.25rem * ${height}) calc(-0.25rem * ${height}) 0.6rem`,
        },
        '& > div > span': {
          transform: 'translateY(0.1516rem)',
        },
      },
    }),
  };
});

/**
 * Внутренний контейнер tile с inset тенями
 */
const TileInner = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'size',
})<{ size: 'small' | 'medium' | 'large' }>(({ theme, size }) => {
  const shadowColors = getShadowColors(theme);
  const sizeStyles = getSizeStyles(size);

  return {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    borderRadius: sizeStyles.borderRadius,
    boxShadow: `inset ${shadowColors.insetShadow} 0 0 0`,
    transition: 'box-shadow 0.15s ease-in',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: sizeStyles.borderRadius,
      pointerEvents: 'none',
      boxShadow: `inset ${shadowColors.insetLight} 0 0 0`,
      transition: 'box-shadow 0.15s ease-in',
    },
  };
});

/**
 * Контейнер для иконки с анимацией
 */
const IconWrapper = styled('span')({
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1,
  transition: 'transform 0.3s ease-in-out',
  '& > svg': {
    display: 'block',
  },
});

export const IconButton: FC<IconButtonProps> = ({
  children,
  onClick,
  disabled = false,
  size = 'medium',
  color = 'primary',
  title,
  'aria-label': ariaLabel,
}) => {
  const theme = useTheme();
  const sizeStyles = getSizeStyles(size);

  // Получаем цвет иконки из темы
  const getIconColor = () => {
    if (color === 'inherit') {
      return 'inherit';
    }
    return theme.palette[color]?.main || theme.palette.primary.main;
  };

  return (
    <TileButtonContainer
      size={size}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      title={title}
      aria-label={ariaLabel}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <TileInner size={size}>
        <IconWrapper
          sx={{
            color: getIconColor(),
            '& > svg': {
              fontSize: sizeStyles.iconSize,
            },
          }}
        >
          {children}
        </IconWrapper>
      </TileInner>
    </TileButtonContainer>
  );
};
