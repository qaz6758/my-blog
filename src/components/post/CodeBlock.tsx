"use client";

import React, { useState, useEffect } from "react";
import { Check, Copy } from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({
  code,
  language = "typescript",
  className = "",
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Prism.highlightAll();
  }, [code, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const cleanCode = code.trim();

  return (
    <div className={`relative group my-5 overflow-hidden rounded-xl border border-neutral-200/80 bg-[#0d1117] dark:border-neutral-800 ${className}`}>
      {/* 嵌入式 CSS：保证各语法 Token 清晰高亮 */}
      <style>{`
        .token.comment, .token.prolog, .token.doctype, .token.cdata { color: #8b949e; font-style: italic; }
        .token.punctuation { color: #c9d1d9; }
        .token.property, .token.tag, .token.boolean, .token.number, .token.constant, .token.symbol { color: #79c0ff; }
        .token.selector, .token.attr-name, .token.string, .token.char, .token.builtin { color: #a5d6ff; }
        .token.operator, .token.entity, .token.url { color: #d2a8ff; }
        .token.atrule, .token.attr-value, .token.keyword { color: #ff7b72; }
        .token.function, .token.class-name { color: #d2a8ff; }
        .token.regex, .token.important, .token.variable { color: #ffa657; }
      `}</style>

      {/* 右上角：语言标识与合并后的复制按钮 */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
        {language && (
          <span className="select-none font-mono text-[10px] uppercase tracking-wider text-neutral-500 opacity-60">
            {language}
          </span>
        )}

        <button
          type="button"
          onClick={handleCopy}
          aria-label="复制代码"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-700/60 bg-neutral-800/80 text-neutral-400 backdrop-blur-sm transition-all duration-200 hover:border-neutral-600 hover:text-neutral-100 hover:bg-neutral-700 opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* 代码内容容器 */}
      <pre className="m-0 overflow-x-auto p-4 sm:p-5 text-[13px] leading-relaxed font-mono">
        <code className={`language-${language} font-mono text-neutral-200`}>
          {cleanCode}
        </code>
      </pre>
    </div>
  );
}