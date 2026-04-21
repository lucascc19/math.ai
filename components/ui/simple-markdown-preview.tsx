import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { cn } from "@/lib/utils";

export function SimpleMarkdownPreview({
  content,
  emptyMessage = "Nada para visualizar ainda.",
  className
}: {
  content: string;
  emptyMessage?: string;
  className?: string;
}) {
  if (!content.trim()) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed border-black/10 bg-white/60 px-4 py-6 text-sm text-neutral-10/60 dark:border-white/10 dark:bg-neutral-20/40 dark:text-neutral-80",
          className
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-black/6 bg-white/80 px-4 py-5 text-sm leading-7 text-neutral-10 dark:border-white/10 dark:bg-neutral-20/60 dark:text-neutral-95 [&_.katex-display]:my-4 [&_.katex-display]:overflow-x-auto [&_.katex-display]:rounded-2xl [&_.katex-display]:border [&_.katex-display]:border-primary-60/15 [&_.katex-display]:bg-primary-95 [&_.katex-display]:px-4 [&_.katex-display]:py-3 [&_.katex]:text-neutral-10 [&_blockquote]:rounded-r-2xl [&_blockquote]:border-l-4 [&_blockquote]:border-primary-60/30 [&_blockquote]:bg-primary-95/60 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_code]:rounded [&_code]:bg-neutral-95 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:mb-1 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_pre]:mb-3 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-neutral-95 [&_pre]:p-4 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
