import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router";

// Renders an article's Markdown. Raw HTML in the source is not rendered
// (react-markdown's default), so article text can't inject markup.
export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h2 className="text-2xl md:text-[28px] font-black text-[#0a0a0a] tracking-[-0.02em] leading-tight mt-12 mb-4">{children}</h2>,
        h2: ({ children }) => <h2 className="text-2xl md:text-[28px] font-black text-[#0a0a0a] tracking-[-0.02em] leading-tight mt-12 mb-4">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-bold text-[#0a0a0a] tracking-[-0.01em] mt-8 mb-3">{children}</h3>,
        p: ({ children }) => <p className="text-[17px] text-[#404040] leading-[1.75] mb-5">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-6 mb-5 space-y-2 text-[17px] text-[#404040] leading-[1.7]">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-6 mb-5 space-y-2 text-[17px] text-[#404040] leading-[1.7]">{children}</ol>,
        li: ({ children }) => <li className="pl-1">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-[#0a0a0a]">{children}</strong>,
        a: ({ href = "", children }) => {
          const className = "text-[#0070f3] underline underline-offset-2 hover:text-[#0057c2] transition-colors";
          if (href.startsWith("/")) return <Link to={href} className={className}>{children}</Link>;
          return <a href={href} target="_blank" rel="noopener noreferrer nofollow" className={className}>{children}</a>;
        },
        blockquote: ({ children }) => <blockquote className="border-l-2 border-[#0a0a0a] pl-5 my-6 [&>p]:text-[#525252] [&>p]:italic">{children}</blockquote>,
        table: ({ children }) => (
          <div className="overflow-x-auto mb-6 border border-[#e5e5e5] rounded-2xl">
            <table className="w-full text-sm text-left">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-[#f5f5f5] text-[#0a0a0a]">{children}</thead>,
        th: ({ children }) => <th className="px-4 py-3 font-semibold border-b border-[#e5e5e5]">{children}</th>,
        td: ({ children }) => <td className="px-4 py-3 text-[#525252] border-b border-[#f0f0f0] align-top">{children}</td>,
        hr: () => <hr className="my-10 border-[#e5e5e5]" />,
        img: ({ src, alt }) => <img src={src} alt={alt ?? ""} loading="lazy" className="w-full rounded-2xl border border-[#e5e5e5] my-6" />,
        code: ({ children }) => <code className="px-1.5 py-0.5 rounded bg-[#f5f5f5] text-[0.9em]">{children}</code>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
