// src/components/theme/ThemeScript.tsx
"use client";

import { useServerInsertedHTML } from "next/navigation";

/**
 * Next.js App Router 官方标准首屏脚本注入组件
 * 利用 useServerInsertedHTML 将主题防闪烁脚本仅在服务端渲染输出到 HTML 头部
 * 客户端渲染时返回 null，彻底消除 React 19 的 "Encountered a script tag" 警告，并保持 0ms 同步生效
 */
export function ThemeScript() {
  useServerInsertedHTML(() => {
    return (
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var docEl = document.documentElement;
                docEl.classList.add('no-transitions');
                var queryTheme = window.location.search.indexOf('theme=light') !== -1 ? 'light' : (window.location.search.indexOf('theme=dark') !== -1 ? 'dark' : null);
                var saved = queryTheme || localStorage.getItem('theme') || (document.cookie.match(/(?:^|;\\s*)theme=([^;]+)/) || [])[1];
                var systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                var isDark = saved ? saved === 'dark' : systemDark;

                if (isDark) {
                  docEl.classList.add('dark');
                  docEl.classList.remove('light');
                } else {
                  docEl.classList.remove('dark');
                  docEl.classList.add('light');
                }

                // 歌单详情直达 0ms 阻断：若带 ?id= 或 ?playlist=，预先隐藏歌单网格避免闪烁
                if (window.location.pathname.indexOf('/playlist') !== -1 && (window.location.search.indexOf('id=') !== -1 || window.location.search.indexOf('playlist=') !== -1)) {
                  docEl.classList.add('hide-playlist-grid');
                }

                // 净化与同步所有 theme-color meta，杜绝深色 media query 劫持 Chrome 原生清屏画布
                var themeColor = isDark ? '#050505' : '#ffffff';
                var themeMetas = document.querySelectorAll('meta[name="theme-color"]');
                themeMetas.forEach(function(m) {
                  m.removeAttribute('media');
                  m.setAttribute('content', themeColor);
                });
                var csMeta = document.querySelector('meta[name="color-scheme"]');
                if (csMeta) {
                  csMeta.setAttribute('content', 'light dark');
                }

                // 零延迟同步 cookie，保证后续每次刷新服务端 100% 字节直出
                if (saved && !document.cookie.includes('theme=')) {
                  document.cookie = 'theme=' + saved + '; path=/; max-age=31536000; SameSite=Lax';
                }

                // 同步读取用户语言偏好，消除首屏 locale 闪跳
                var savedLang = localStorage.getItem('blog_lang');
                var validLangs = ['en','zh-CN','zh-TW','ja','ko'];
                if (savedLang && validLangs.indexOf(savedLang) !== -1) {
                  docEl.setAttribute('data-locale', savedLang);
                  docEl.lang = savedLang;
                } else {
                  docEl.setAttribute('data-locale', 'en');
                }

                function removeNoTransitions() {
                  requestAnimationFrame(function() {
                    requestAnimationFrame(function() {
                      docEl.classList.remove('no-transitions');
                    });
                  });
                }
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', removeNoTransitions);
                } else {
                  removeNoTransitions();
                }
              } catch (e) {}
            })();
          `,
        }}
      />
    );
  });

  return null;
}
