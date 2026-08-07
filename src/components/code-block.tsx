import { CopyButton } from './copy-button';

interface CodeBlockProps {
  readonly code: string;
  /** Shown in the header strip, so a reader can find the file in the repo. */
  readonly filename: string;
}

export function CodeBlock({ code, filename }: CodeBlockProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50">
      <div className="flex items-center justify-between gap-3 border-b border-neutral-800 px-4 py-2">
        <span className="font-mono text-xs text-neutral-500">{filename}</span>
        <CopyButton value={code} />
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className="font-mono text-neutral-200">{code}</code>
      </pre>
    </div>
  );
}
