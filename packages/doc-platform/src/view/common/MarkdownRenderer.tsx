import { type FC } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box } from '@platform/ui';

interface MarkdownRendererProps {
  content: string;
}

/**
 * Компонент для рендеринга markdown контента.
 * Поддерживает GitHub Flavored Markdown (GFM).
 *
 * @component
 */
export const MarkdownRenderer: FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <Box
      sx={{
        '& h1': {
          fontSize: '2.5rem',
          fontWeight: 700,
          marginTop: 4,
          marginBottom: 2,
        },
        '& h2': {
          fontSize: '2rem',
          fontWeight: 600,
          marginTop: 3,
          marginBottom: 1.5,
        },
        '& h3': {
          fontSize: '1.5rem',
          fontWeight: 600,
          marginTop: 2,
          marginBottom: 1,
        },
        '& h4': {
          fontSize: '1.25rem',
          fontWeight: 600,
          marginTop: 2,
          marginBottom: 1,
        },
        '& p': {
          marginTop: 1,
          marginBottom: 1,
          lineHeight: 1.7,
        },
        '& ul, & ol': {
          marginTop: 1,
          marginBottom: 1,
          paddingLeft: 3,
        },
        '& li': {
          marginTop: 0.5,
          marginBottom: 0.5,
        },
        '& code': {
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          padding: '2px 6px',
          borderRadius: 1,
          fontSize: '0.875em',
          fontFamily: 'monospace',
        },
        '& pre': {
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          padding: 2,
          borderRadius: 1,
          overflow: 'auto',
          marginTop: 1,
          marginBottom: 1,
        },
        '& pre code': {
          backgroundColor: 'transparent',
          padding: 0,
        },
        '& table': {
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: 2,
          marginBottom: 2,
        },
        '& th, & td': {
          border: '1px solid rgba(0, 0, 0, 0.12)',
          padding: 1.5,
          textAlign: 'left',
        },
        '& th': {
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          fontWeight: 600,
        },
        '& blockquote': {
          borderLeft: '4px solid rgba(0, 0, 0, 0.12)',
          paddingLeft: 2,
          marginLeft: 0,
          marginTop: 1,
          marginBottom: 1,
          color: 'text.secondary',
        },
        '& a': {
          color: 'primary.main',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
        },
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </Box>
  );
};
