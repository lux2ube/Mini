

import { micromark } from 'micromark';
import { cn } from '@/lib/utils';

interface ProseProps {
  html: string;
  className?: string;
}

export default function Prose({ html, className }: ProseProps) {
  const processedHtml = micromark(html);

  return (
    <div
      className={cn(
        'prose prose-gray dark:prose-invert max-w-none',
        'prose-headings:font-headline prose-headings:font-bold',
        'prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl',
        'prose-a:text-primary hover:prose-a:text-primary/80 prose-a:transition-colors',
        'prose-strong:font-semibold',
        'prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:font-normal',
        'prose-code:bg-muted prose-code:text-foreground prose-code:rounded-md prose-code:p-1 prose-code:font-mono',
        'prose-pre:bg-muted prose-pre:text-foreground prose-pre:rounded-lg',
        className
      )}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
}
