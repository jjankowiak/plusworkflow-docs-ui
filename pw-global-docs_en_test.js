(function () {
	"use strict";

	/*
	 * =========================================
	 * PLUSWORKFLOW — GLOBAL DOCS UI V4
	 * =========================================
	 * 1. Language switcher EN -> PL
	 * 2. Recently viewed articles EN
	 * 3. Images
	 * 4. Right table of contents
	 * 5. Light, collapsible code blocks
	 * 6. Compact vertical article lists
	 * 7. Left documentation tree filter (PL + EN)
	 *
	 * Tahoma / #D97706 / PL + EN / Dark Mode
	 * =========================================
	 */

	if (window.__pwGlobalDocsUIv4) return;
	window.__pwGlobalDocsUIv4 = true;

	const ARTICLE = "#topic-content";
	const ACCENT = "#D97706";
	const HISTORY_KEY = "pw-docs-recent-articles-v1";

	let refreshPending = false;
	let lastPath = location.pathname;

	function isEnglishPath(path) {
		return /^\/en(?:\/|$)/.test(path);
	}

	function isEN() {
		return isEnglishPath(location.pathname);
	}

	function tr(pl, en) {
		return isEN() ? en : pl;
	}

	function el(tag, cls, text) {
		const node = document.createElement(tag);
		if (cls) node.className = cls;
		if (text !== undefined) node.textContent = text;
		return node;
	}

	function addStyle(id, css) {
		if (document.getElementById(id)) return;

		const style = document.createElement("style");
		style.id = id;
		style.textContent = css;
		document.head.appendChild(style);
	}

	function normalizeText(value) {
		return (value || "")
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/\s+/g, " ")
			.trim()
			.toLowerCase();
	}

	async function copyText(text) {
		if (navigator.clipboard && window.isSecureContext) {
			await navigator.clipboard.writeText(text);
			return;
		}

		const field = el("textarea");
		field.value = text;
		field.style.cssText =
			"position:fixed;left:-9999px;opacity:0";

		document.body.appendChild(field);
		field.select();

		const success = document.execCommand("copy");
		field.remove();

		if (!success) {
			throw new Error("Clipboard unavailable");
		}
	}

	/* =========================================
	   1. GLOBAL STYLES
	   ========================================= */

	addStyle("pw-global-docs-v4-styles", `
    /* ====================================== LANGUAGE SWITCHER ====================================== */
    #pw-language-switcher {
      position: fixed;
      z-index: 99999;
      visibility: hidden;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 9px 14px;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 999px;
      color: #475569;
      font: 600 12px/1.2 Tahoma, Geneva, sans-serif;
      text-decoration: none;
      white-space: nowrap;
      box-sizing: border-box;
      box-shadow: 0 3px 12px rgba(15,23,42,.08);
      transition: background .2s ease,
        border-color .2s ease;
    }
    #pw-language-switcher:hover {
      background: #FFF7ED;
      border-color: #FDBA74;
      text-decoration: none;
    }
    #pw-language-switcher .pw-lang-arrow {
      color: #94A3B8;
    }
    #pw-language-switcher .pw-lang-target {
      color: #D97706;
    }
    /* ====================================== RECENTLY VIEWED ====================================== */
    #pw-recent-button {
      position: fixed;
      z-index: 99990;
      visibility: hidden;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 9px 13px;
      border: 1px solid #E2E8F0;
      border-radius: 999px;
      background: #FFFFFF;
      color: #334155;
      font: 600 12px/1.2 Tahoma, Geneva, sans-serif;
      cursor: pointer;
      box-shadow: 0 3px 12px rgba(15,23,42,.08);
    }
    #pw-recent-button:hover {
      background: #FFF7ED;
      border-color: #FDBA74;
    }
    #pw-recent-button .pw-recent-count {
      padding: 2px 6px;
      border-radius: 999px;
      background: #FFF7ED;
      color: #D97706;
      font-size: 10px;
    }
    #pw-recent-panel {
      position: fixed;
      z-index: 99991;
      display: none;
      flex-direction: column;
      width: min(360px, calc(100vw - 24px));
      max-height: min(480px, 65vh);
      overflow: hidden;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      box-shadow: 0 12px 35px rgba(15,23,42,.16);
      color: #334155;
      font-family: Tahoma, Geneva, sans-serif;
    }
    #pw-recent-panel.pw-open {
      display: flex;
    }
    #pw-recent-panel .pw-recent-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 15px;
      border-bottom: 1px solid #EEF1F5;
    }
    #pw-recent-panel .pw-recent-title {
      font-size: 13px;
      font-weight: 700;
    }
    #pw-recent-panel .pw-recent-clear {
      border: 0;
      background: transparent;
      color: #D97706;
      font: 12px Tahoma, Geneva, sans-serif;
      cursor: pointer;
    }
    #pw-recent-panel .pw-recent-list {
      overflow-y: auto;
      padding: 6px;
    }
    #pw-recent-panel .pw-recent-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 9px;
      border-radius: 8px;
    }
    #pw-recent-panel .pw-recent-item:hover {
      background: #FFF7ED;
    }
    #pw-recent-panel .pw-recent-link {
      flex: 1;
      min-width: 0;
      color: #334155;
      text-decoration: none;
      font-size: 12px;
    }
    #pw-recent-panel .pw-recent-name {
      display: block;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    #pw-recent-panel .pw-recent-path {
      display: block;
      margin-top: 4px;
      color: #94A3B8;
      font-size: 10px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    #pw-recent-panel .pw-recent-remove {
      border: 0;
      background: transparent;
      color: #94A3B8;
      font-size: 18px;
      cursor: pointer;
    }
    #pw-recent-panel .pw-recent-remove:hover {
      color: #D97706;
    }
    #pw-recent-panel .pw-recent-empty {
      padding: 26px 12px;
      text-align: center;
      color: #94A3B8;
      font-size: 12px;
    }
    /* ====================================== DOCUMENT IMAGES ====================================== */
    img.pw-doc-image {
      display: block;
      max-width: 100% !important;
      height: auto !important;
      box-sizing: border-box;
      padding: 5px;
      border: 1px solid #E2E8F0 !important;
      border-radius: 10px !important;
      background: #FFFFFF;
      box-shadow: 0 3px 12px rgba(15,23,42,.07);
      transition: border-color .2s ease,
        box-shadow .2s ease;
    }
    img.pw-doc-image:hover {
      border-color: #FDBA74 !important;
      box-shadow: 0 5px 18px rgba(217,119,6,.12);
    }
    html.pw-dark-mode img.pw-doc-image {
      background: #292F3B;
      border-color: #465160 !important;
    }
    /* ====================================== RIGHT TABLE OF CONTENTS ====================================== */
    #page_toc.right_toc.pw-modern-toc {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      height: auto !important;
      max-height: calc(100vh - 185px) !important;
      overflow: hidden !important;
      padding: 14px 12px !important;
      background: #FFFFFF;
      border: 1px solid #E9EDF2;
      border-radius: 14px;
      box-shadow: 0 3px 16px rgba(15,23,42,.045);
      color: #334155;
      font-family: Tahoma, Geneva, sans-serif;
    }
    #page_toc.pw-modern-toc > p {
      display: flex;
      align-items: center;
      gap: 9px;
      flex-shrink: 0;
      margin: 0 !important;
      padding: 3px 2px 14px !important;
      color: #334155 !important;
      font-size: 13px !important;
      font-weight: 700 !important;
    }
    #page_toc.pw-modern-toc > p::before {
      content: "☷";
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: #FFF7ED;
      color: #D97706;
      font-size: 18px;
    }
    #page_toc .pw-toc-toggle {
      margin-left: auto;
      width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: 0;
      border-radius: 7px;
      color: #94A3B8;
      cursor: pointer;
    }
    #page_toc .pw-toc-toggle:hover {
      background: #FFF7ED;
      color: #D97706;
    }
    #page_toc .pw-toc-toggle svg {
      width: 16px;
      height: 16px;
      transition: transform .2s ease;
    }
    #page_toc.pw-toc-collapsed .pw-toc-toggle svg {
      transform: rotate(180deg);
    }
    #page_toc.pw-modern-toc > ul {
      flex: 1 1 auto;
      min-height: 0;
      margin: 0 !important;
      padding: 4px 2px 4px 0 !important;
      list-style: none !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      scrollbar-width: thin;
      scrollbar-color: #D5DCE5 transparent;
    }
    #page_toc.pw-toc-collapsed > ul {
      display: none !important;
    }
    #page_toc.pw-toc-collapsed {
      max-height: none !important;
    }
    #page_toc.pw-modern-toc ul ul {
      margin: 3px 0 5px 11px !important;
      padding: 0 0 0 11px !important;
      border-left: 1px solid #E8EDF3;
      list-style: none !important;
    }
    #page_toc.pw-modern-toc li {
      position: relative;
      display: block;
      margin: 2px 0 !important;
      padding: 0 !important;
      list-style: none !important;
      background: transparent !important;
    }
    #page_toc.pw-modern-toc li::before {
      display: none !important;
    }
    #page_toc.pw-modern-toc li > a {
      display: block;
      width: 100%;
      box-sizing: border-box;
      margin: 0 !important;
      padding: 9px 10px 9px 13px !important;
      border: 0 !important;
      border-left: 3px solid transparent !important;
      border-radius: 7px;
      background: transparent;
      color: #64748B !important;
      font: 400 12px/1.55
        Tahoma, Geneva, sans-serif !important;
      text-decoration: none !important;
      overflow-wrap: anywhere;
      white-space: normal !important;
    }
    #page_toc.pw-modern-toc li > a:hover {
      background: #FFF7ED !important;
      color: #C2410C !important;
    }
    #page_toc.pw-modern-toc li > a.pw-toc-active {
      background: #FFF7ED !important;
      color: #C2410C !important;
      border-left-color: #D97706 !important;
      font-weight: 700 !important;
    }
    #page_toc.pw-modern-toc ul ul li > a {
      font-size: 11.5px !important;
      padding: 7px 9px 7px 12px !important;
    }
    html.pw-dark-mode
    #page_toc.right_toc.pw-modern-toc {
      background: #202631;
      border-color: #394250;
      color: #E8EDF5;
    }
    html.pw-dark-mode
    #page_toc.pw-modern-toc > p {
      color: #F8FAFC !important;
    }
    html.pw-dark-mode
    #page_toc.pw-modern-toc li > a {
      color: #AAB5C5 !important;
    }
    html.pw-dark-mode
    #page_toc.pw-modern-toc li > a.pw-toc-active {
      background: #3C3029 !important;
      color: #FDBA74 !important;
    }
    /* ====================================== LIGHT CODE BLOCKS — NEW ====================================== */
    #topic-content pre.pw-code-v4 {
      position: relative !important;
      display: block !important;
      box-sizing: border-box !important;
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      margin: 16px 0 23px !important;
      padding: 49px 16px 16px !important;
      background: #FAFBFD !important;
      color: #334155 !important;
      border: 1px solid #E2E8F0 !important;
      border-radius: 10px !important;
      box-shadow: 0 2px 7px rgba(15,23,42,.025);
      overflow-x: auto !important;
      overflow-y: hidden !important;
      white-space: pre !important;
      tab-size: 2;
      scrollbar-width: thin;
    }
    /* Pasek nagłówka */
    #topic-content pre.pw-code-v4::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 39px;
      background: #F3F6FA;
      border-bottom: 1px solid #E5EAF0;
      pointer-events: none;
    }
    /* Język kodu */
    #topic-content pre.pw-code-v4
    > .pw-code-v4-lang {
      position: absolute;
      top: 0;
      left: 13px;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      height: 39px;
      color: #64748B;
      font: 600 11px/1.2
        Tahoma, Geneva, sans-serif;
    }
    #topic-content pre.pw-code-v4
    > .pw-code-v4-lang::before {
      content: "</>";
      margin-right: 8px;
      color: #D97706;
      font: 700 12px Consolas, monospace;
    }
    /* Przyciski w nagłówku */
    #topic-content pre.pw-code-v4
    > .pw-code-v4-actions {
      position: absolute;
      top: 6px;
      right: 7px;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    #topic-content pre.pw-code-v4
    .pw-code-v4-btn {
      position: static !important;
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      width: auto !important;
      min-height: 27px;
      padding: 5px 9px !important;
      background: #FFFFFF !important;
      color: #64748B !important;
      border: 1px solid #DEE5EC !important;
      border-radius: 6px !important;
      font: 11px/1.2
        Tahoma, Geneva, sans-serif !important;
      white-space: nowrap !important;
      cursor: pointer;
      box-shadow: none !important;
      transform: none !important;
    }
    #topic-content pre.pw-code-v4
    .pw-code-v4-btn:hover {
      background: #FFF7ED !important;
      border-color: #FDBA74 !important;
      color: #B85C08 !important;
    }
    #topic-content pre.pw-code-v4
    .pw-code-v4-btn:focus-visible {
      outline: 2px solid #D97706 !important;
      outline-offset: 2px;
    }
    /* Oryginalne przyciski kopiowania */
    #topic-content pre.pw-code-v4
    > button.copy-button,
    #topic-content pre.pw-code-v4
    > button.copy-to-clipboard {
      display: none !important;
    }
    /* Zachowanie kodu highlight.js */
    #topic-content pre.pw-code-v4 code,
    #topic-content pre.pw-code-v4 > span > code {
      display: block;
      max-width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
      border: 0 !important;
      background: transparent !important;
      font: 12.5px/1.75
        Consolas, "Courier New", monospace !important;
      white-space: pre !important;
      overflow-wrap: normal !important;
      word-break: normal !important;
    }
    /* Delikatniejsza składnia */
    #topic-content pre.pw-code-v4
    code .hljs-comment {
      color: #8391A4 !important;
    }
    #topic-content pre.pw-code-v4
    code .hljs-string {
      color: #27806A !important;
    }
    #topic-content pre.pw-code-v4
    code .hljs-number {
      color: #B45309 !important;
    }
    #topic-content pre.pw-code-v4
    code .hljs-keyword {
      color: #8053B8 !important;
    }
    /* Zawijanie wierszy */
    #topic-content pre.pw-code-v4.pw-code-v4-wrap,
    #topic-content pre.pw-code-v4.pw-code-v4-wrap code,
    #topic-content pre.pw-code-v4.pw-code-v4-wrap
    > span > code,
    #topic-content pre.pw-code-v4.pw-code-v4-wrap
    code span {
      white-space: pre-wrap !important;
      overflow-wrap: anywhere !important;
      word-break: normal !important;
    }
    /* ====================================== ZWIJANIE CAŁEGO BLOKU KODU ====================================== */
    #topic-content pre.pw-code-v4.pw-code-v4-collapsed {
      height: 40px !important;
      min-height: 40px !important;
      max-height: 40px !important;
      padding-top: 40px !important;
      padding-bottom: 0 !important;
      overflow: hidden !important;
    }
    #topic-content pre.pw-code-v4.pw-code-v4-collapsed
    > code,
    #topic-content pre.pw-code-v4.pw-code-v4-collapsed
    > span:not(.pw-code-v4-lang):not(.pw-code-v4-actions) {
      visibility: hidden !important;
    }
    /* Dark Mode */
    html.pw-dark-mode
    #topic-content pre.pw-code-v4 {
      background: #242B36 !important;
      color: #E2E8F0 !important;
      border-color: #394250 !important;
    }
    html.pw-dark-mode
    #topic-content pre.pw-code-v4::before {
      background: #2D3542;
      border-bottom-color: #394250;
    }
    html.pw-dark-mode
    #topic-content pre.pw-code-v4
    > .pw-code-v4-lang {
      color: #CBD5E1;
    }
    html.pw-dark-mode
    #topic-content pre.pw-code-v4 code {
      color: #E2E8F0;
    }
    html.pw-dark-mode
    #topic-content pre.pw-code-v4
    .pw-code-v4-btn {
      background: #354052 !important;
      border-color: #465160 !important;
      color: #E2E8F0 !important;
    }
    /* Accessibility and mobile */
    @media (max-width: 640px) {
      #topic-content pre.pw-code-v4 {
        padding: 49px 12px 13px !important;
      }
      #topic-content pre.pw-code-v4
      .pw-code-v4-btn {
        padding: 5px 7px !important;
        font-size: 10px !important;
      }
      #pw-language-switcher,
      #pw-recent-button {
        padding: 7px 10px;
        font-size: 11px;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      #pw-language-switcher,
      #pw-recent-button,
      #page_toc.pw-modern-toc * {
        transition: none !important;
      }
    }
  `);

	/* =========================================
	   2. LANGUAGE SWITCHER — PL ↔ EN
	   ========================================= */

	let languageButton = null;

	/* Adres odpowiadającej wersji językowej */
	function languageURL() {
		const url = new URL(window.location.href);

		if (isEN()) {
			// EN → PL
			url.pathname =
				url.pathname.replace(/^\/en(?=\/|$)/, "") || "/";
		} else {
			// PL → EN
			const path = url.pathname || "/";

			url.pathname =
				"/en" + (path.startsWith("/") ? path : "/" + path);
		}

		return url.toString();
	}

	/* Utworzenie i aktualizacja przycisku */
	function initLanguage() {
		languageButton = document.getElementById(
			"pw-language-switcher"
		);

		if (!languageButton) {
			languageButton = el("a");
			languageButton.id = "pw-language-switcher";
			document.body.appendChild(languageButton);
		}

		// Aktualizuj kierunek zależnie od języka strony.
		updateLanguageButton();

		// Adres ustalany na bieżąco przy kliknięciu.
		languageButton.addEventListener("click", function () {
			languageButton.href = languageURL();
		});
	}

	/* Napisy PL → EN lub EN → PL */
	function updateLanguageButton() {
		if (!languageButton) return;
		const source = tr("PL", "EN");
		const target = tr("EN", "PL");
		languageButton.innerHTML = `<span>${source}</span><span class="pw-lang-arrow">→</span><span class="pw-lang-target">${target}</span>`;
		languageButton.setAttribute("aria-label", tr("Switch to English", "Switch to Polish"));
		languageButton.setAttribute("hreflang", target.toLowerCase());
		languageButton.title = tr("English version", "Polska wersja");
		languageButton.href = languageURL();
	}

	// Shared positioning for the two fixed header buttons.
	function positionBeside(button, anchor, gap) {
		const rect = anchor && anchor.getBoundingClientRect();
		if (!rect || !rect.width || !rect.height) {
			button.style.visibility = "hidden";
			return null;
		}
		const top = rect.top + (rect.height - button.offsetHeight) / 2;
		const left = rect.left - button.offsetWidth - gap;
		if (left < 8) {
			button.style.visibility = "hidden";
			return null;
		}
		button.style.top = top + "px";
		button.style.left = left + "px";
		button.style.visibility = "visible";
		return { top, left };
	}

	/* Pozycja obok pola wyszukiwania */
	function positionLanguage() {
		if (!languageButton) return;
		updateLanguageButton();
		const search = document.querySelector("div.x-form-field-wrap.x-form-field-trigger-wrap.search") ||
			document.querySelector('#helpiq-header .search, #helpiq-header [class*="search"]');
		positionBeside(languageButton, search, 16);
	}

	/* =========================================
	   3. RECENTLY VIEWED — PL + EN
	   ========================================= */

	let recentButton = null;
	let recentPanel = null;
	let recentList = null;
	let recentCount = null;
	let recentClear = null;
	let memoryHistory = [];

	function currentHistoryLanguage() {
		return isEN() ? "EN" : "PL";
	}

	function historyItemsForLanguage(items) {
		const language = currentHistoryLanguage();

		return items.filter(function (item) {
			if (!item || !item.url) return false;

			try {
				const url = new URL(item.url, location.origin);
				if (url.origin !== location.origin) return false;

				const itemLanguage = isEnglishPath(url.pathname) ? "EN" : "PL";

				return itemLanguage === language;
			} catch (_) {
				return false;
			}
		});
	}

	function readHistory() {
		try {
			const items = JSON.parse(
				localStorage.getItem(HISTORY_KEY) || "[]"
			);

			return Array.isArray(items)
				? items
				: memoryHistory;
		} catch (_) {
			return memoryHistory;
		}
	}

	function saveHistory(items) {
		memoryHistory = items;

		try {
			localStorage.setItem(
				HISTORY_KEY,
				JSON.stringify(items)
			);
		} catch (_) { }
	}

	function currentArticleTitle() {
		const root = document.querySelector(ARTICLE);
		const heading = root
			? root.querySelector("h1")
			: null;

		if (heading && heading.textContent.trim()) {
			return heading.textContent.trim();
		}

		return document.title
			.replace(/\s*[-–|]\s*PlusWorkflow.*$/i, "")
			.trim();
	}

	function rememberArticle() {
		// Nie zapisuj strony głównej PL ani EN.
		if (/^\/(?:en\/?)?$/.test(location.pathname)) {
			return;
		}

		const url = location.origin + location.pathname;
		const title = currentArticleTitle();

		if (!title) return;

		const items = readHistory().filter(function (item) {
			return item && item.url !== url;
		});

		items.unshift({
			url: url,
			title: title,
			lang: currentHistoryLanguage(),
			visitedAt: Date.now()
		});

		// Maksymalnie 10 artykułów na język.
		const byLanguage = english => items.filter(item =>
			isEnglishPath(new URL(item.url, location.origin).pathname) === english
		).slice(0, 10);
		saveHistory([...byLanguage(true), ...byLanguage(false)]);
		renderRecent();
	}

	function historyIcon() {
		return (
			'<svg viewBox="0 0 24 24" ' +
			'width="18" height="18" ' +
			'fill="none" stroke="currentColor" ' +
			'stroke-width="1.8" stroke-linecap="round" ' +
			'stroke-linejoin="round" aria-hidden="true">' +
			'<path d="M3 12a9 9 0 1 0 3-6.7"/>' +
			'<path d="M3 3v5h5"/>' +
			'<path d="M12 7v5l3 2"/>' +
			'</svg>'
		);
	}

	function updateRecentLabels() {
		if (!recentButton) return;

		const label = tr(
			"Ostatnio przeglądane",
			"Recently viewed"
		);

		recentButton.title = label;
		recentButton.setAttribute("aria-label", label);

		if (recentPanel) {
			const title = recentPanel.querySelector(
				".pw-recent-title"
			);

			if (title) title.textContent = label;
		}

		if (recentClear) {
			recentClear.textContent = tr(
				"Wyczyść historię",
				"Clear history"
			);
		}
	}

	function initRecent() {
		recentButton = document.getElementById(
			"pw-recent-button"
		);

		recentPanel = document.getElementById(
			"pw-recent-panel"
		);

		if (!recentButton) {
			recentButton = el("button");
			recentButton.id = "pw-recent-button";
			recentButton.type = "button";
			document.body.appendChild(recentButton);
		}

		// Wyłącznie ikona, bez nagłówka na przycisku.
		recentButton.innerHTML = historyIcon();

		// Licznik zapisujemy jako niewidoczny element,
		// więc nie poszerza przycisku.
		recentCount = el("span", "pw-recent-count", "0");
		recentCount.hidden = true;
		recentButton.appendChild(recentCount);

		if (!recentPanel) {
			recentPanel = el("section");
			recentPanel.id = "pw-recent-panel";

			const header = el(
				"div",
				"pw-recent-header"
			);

			const title = el(
				"span",
				"pw-recent-title"
			);

			recentClear = el(
				"button",
				"pw-recent-clear"
			);
			recentClear.type = "button";

			recentList = el(
				"div",
				"pw-recent-list"
			);

			header.append(title, recentClear);
			recentPanel.append(header, recentList);
			document.body.appendChild(recentPanel);
		} else {
			recentList = recentPanel.querySelector(
				".pw-recent-list"
			);

			recentClear = recentPanel.querySelector(
				".pw-recent-clear"
			);
		}

		updateRecentLabels();

		recentButton.addEventListener("click", function () {
			recentPanel.classList.toggle("pw-open");
			positionRecent();
		});

		if (recentClear) {
			recentClear.addEventListener("click", function () {
				const remaining = readHistory().filter(
					function (item) {
						return !historyItemsForLanguage([item]).length;
					}
				);

				saveHistory(remaining);
				renderRecent();
			});
		}

		document.addEventListener("click", function (event) {
			if (
				recentPanel &&
				recentButton &&
				!recentPanel.contains(event.target) &&
				!recentButton.contains(event.target)
			) {
				recentPanel.classList.remove("pw-open");
			}
		});

		document.addEventListener("keydown", function (event) {
			if (event.key === "Escape" && recentPanel) {
				recentPanel.classList.remove("pw-open");
			}
		});

		window.addEventListener("storage", function (event) {
			if (event.key === HISTORY_KEY) {
				renderRecent();
			}
		});

		renderRecent();
	}

	function renderRecent() {
		if (!recentList) return;

		updateRecentLabels();

		const items = historyItemsForLanguage(
			readHistory()
		).slice(0, 10);

		recentList.replaceChildren();

		if (recentCount) {
			recentCount.textContent = String(items.length);
		}

		if (recentClear) {
			recentClear.hidden = items.length === 0;
		}

		if (!items.length) {
			recentList.appendChild(
				el(
					"div",
					"pw-recent-empty",
					tr(
						"Brak ostatnio przeglądanych artykułów",
						"No recently viewed articles"
					)
				)
			);
			return;
		}

		items.forEach(function (item) {
			const row = el(
				"div",
				"pw-recent-item"
			);

			const link = el(
				"a",
				"pw-recent-link"
			);

			link.href = item.url;

			const name = el(
				"span",
				"pw-recent-name",
				item.title
			);

			const path = el(
				"span",
				"pw-recent-path",
				new URL(item.url, location.origin).pathname
			);

			link.append(name, path);

			const remove = el(
				"button",
				"pw-recent-remove",
				"×"
			);

			remove.type = "button";
			remove.setAttribute(
				"aria-label",
				tr(
					"Usuń artykuł z historii",
					"Remove article from history"
				)
			);

			remove.addEventListener("click", function () {
				saveHistory(
					readHistory().filter(function (entry) {
						return entry.url !== item.url;
					})
				);

				renderRecent();
			});

			row.append(link, remove);
			recentList.appendChild(row);
		});
	}

	function positionRecent() {
		if (!recentButton || !recentPanel) return;

		updateRecentLabels();

		// Widoczny zarówno w PL, jak i EN.
		recentButton.style.display = "inline-flex";

		const notification = document.querySelector(
			'div[class*="navbarv3-module__notificationContainer"]'
		);

		const position = positionBeside(recentButton, notification, 12);
		if (!position) return;
		const { top, left } = position;

		const panelWidth = recentPanel.offsetWidth || 360;

		const panelLeft = Math.max(
			8,
			Math.min(
				left,
				window.innerWidth - panelWidth - 8
			)
		);

		const spaceBelow =
			window.innerHeight -
			(top + recentButton.offsetHeight);

		const panelHeight = recentPanel.offsetHeight || 400;

		const panelTop = spaceBelow >= 300
			? top + recentButton.offsetHeight + 12
			: Math.max(8, top - panelHeight - 12);

		recentPanel.style.left = panelLeft + "px";
		recentPanel.style.top = panelTop + "px";
	}

	/* =========================================
	   4. IMAGE STYLING
	   ========================================= */

	function updateImages() {
		const root = document.querySelector("#topic-content");
		if (!root) return;

		root.querySelectorAll("img").forEach(function (image) {

			function apply() {

				// Elementy interfejsu nie są ilustracjami.
				if (
					image.closest(
						"button, .x-btn, .icon-section, .copy-button"
					)
				) {
					image.classList.remove("pw-doc-image");
					return;
				}

				// 1. Wymiary zapisane bezpośrednio w style.
				const inlineWidth = image.style.width;
				const inlineHeight = image.style.height;

				// 2. Atrybuty HTML width i height.
				const htmlWidth = image.getAttribute("width");
				const htmlHeight = image.getAttribute("height");

				function getDimension(inlineValue, htmlValue, naturalValue) {

					// Akceptujemy wyłącznie wartości w px.
					// Wartości procentowe pozostawiamy
					// do oceny według rzeczywistego rozmiaru.
					if (/^\d+(\.\d+)?px$/.test(inlineValue)) {
						return parseFloat(inlineValue);
					}

					if (
						htmlValue !== null &&
						/^\d+(\.\d+)?$/.test(htmlValue)
					) {
						return parseFloat(htmlValue);
					}

					return naturalValue;
				}

				const width = getDimension(
					inlineWidth,
					htmlWidth,
					image.naturalWidth
				);

				const height = getDimension(
					inlineHeight,
					htmlHeight,
					image.naturalHeight
				);

				// Stylujemy tylko obrazy mające
				// co najmniej 50 px w OBU wymiarach.
				const shouldStyle =
					width >= 50 &&
					height >= 50;

				image.classList.toggle(
					"pw-doc-image",
					shouldStyle
				);

				image.classList.remove("pw-small-image");
			}

			// Sprawdzamy od razu — żeby małe ikony
			// nie otrzymywały stylu podczas ładowania.
			apply();

			// Dla obrazów ładowanych asynchronicznie
			// sprawdzamy rozmiar ponownie.
			if (
				!image.complete &&
				image.dataset.pwImageWatch !== "3"
			) {
				image.dataset.pwImageWatch = "3";

				image.addEventListener(
					"load",
					apply,
					{ once: true }
				);
			}
		});
	}

	/* =========================================
	   5. RIGHT TABLE OF CONTENTS
	   ========================================= */

	let toc = null;
	let tocSignature = "";
	let currentTocLink = null;

	function tocLabels() {
		return {
			title: tr("Na tej stronie", "On this page"),
			expand: tr("Rozwiń spis treści", "Expand contents"),
			collapse: tr("Zwiń spis treści", "Collapse contents")
		};
	}

	function tocLinks() {
		if (!toc) return [];

		return Array.from(
			toc.querySelectorAll("li > a[href]")
		);
	}

	function headingForTocLink(link) {
		const root = document.querySelector(ARTICLE);
		if (!root) return null;

		const href = link.getAttribute("href") || "";
		const title = normalizeText(link.textContent);

		const headings = Array.from(
			root.querySelectorAll("h1, h2, h3, h4, h5, h6")
		);

		let anchor = "";
		const dollar = href.indexOf("$");
		const hash = href.indexOf("#");

		if (dollar >= 0) {
			anchor = href.substring(dollar + 1);
		} else if (hash >= 0) {
			anchor = href.substring(hash + 1);
		}

		if (anchor) {
			try {
				anchor = decodeURIComponent(anchor);
			} catch (_) { }

			const target = Array.from(
				root.querySelectorAll("[id], [name]")
			).find(function (node) {
				return (
					node.id === anchor ||
					node.getAttribute("name") === anchor
				);
			});

			if (target) {
				if (target.matches("h1, h2, h3, h4, h5, h6")) {
					return target;
				}

				const containingHeading = target.closest(
					"h1, h2, h3, h4, h5, h6"
				);

				if (containingHeading) {
					return containingHeading;
				}

				// Kotwica może być bezpośrednio przed nagłówkiem.
				const nextHeading = headings.find(function (heading) {
					return Boolean(
						target.compareDocumentPosition(heading) &
						Node.DOCUMENT_POSITION_FOLLOWING
					);
				});

				if (
					nextHeading &&
					normalizeText(nextHeading.textContent) === title
				) {
					return nextHeading;
				}
			}
		}

		// Dopasowanie po tytule, także dla H1.
		return headings.find(function (heading) {
			return normalizeText(heading.textContent) === title;
		}) || null;
	}

	function updateTocButton() {
		if (!toc) return;

		const button = toc.querySelector(".pw-toc-toggle");
		if (!button) return;

		const collapsed = toc.classList.contains(
			"pw-toc-collapsed"
		);

		const labels = tocLabels();

		button.setAttribute(
			"aria-expanded",
			String(!collapsed)
		);

		button.setAttribute(
			"aria-label",
			collapsed ? labels.expand : labels.collapse
		);

		button.title =
			collapsed ? labels.expand : labels.collapse;
	}

	function updateToc() {
		const found = document.querySelector(
			"#page_toc.right_toc"
		);

		if (!found) {
			toc = null;
			tocSignature = "";
			currentTocLink = null;
			return;
		}

		toc = found;

		const links = tocLinks();
		if (!links.length) return;

		toc.classList.add("pw-modern-toc");

		const signature = links.map(
			link =>
				link.getAttribute("href") + ":" +
				link.textContent.trim()
		).join("|");

		const changed =
			signature !== tocSignature ||
			!currentTocLink ||
			!toc.contains(currentTocLink);
		tocSignature = signature;

		const labels = tocLabels();

		let header = toc.querySelector(":scope > p");

		if (!header) {
			header = el("p");
			toc.prepend(header);
		}

		let textNode = Array.from(header.childNodes)
			.find(node => node.nodeType === Node.TEXT_NODE);

		if (!textNode) {
			textNode = document.createTextNode("");
			header.prepend(textNode);
		}

		textNode.textContent = labels.title;

		let toggle = header.querySelector(".pw-toc-toggle");

		if (!toggle) {
			toggle = el("button", "pw-toc-toggle");
			toggle.type = "button";

			toggle.innerHTML =
				'<svg viewBox="0 0 24 24" fill="none" ' +
				'stroke="currentColor" stroke-width="2" ' +
				'stroke-linecap="round" stroke-linejoin="round">' +
				'<path d="m6 15 6-6 6 6"/></svg>';

			toggle.addEventListener("click", function () {
				toc.classList.toggle("pw-toc-collapsed");
				updateTocButton();
			});

			header.appendChild(toggle);
		}

		updateTocButton();

		if (changed) {
			currentTocLink = null;

			links.forEach(function (link) {
				link.classList.remove("pw-toc-active");
				link.removeAttribute("aria-current");
			});
		}

		updateActiveToc();
	}

	function setActiveToc(link) {
		if (!link || !toc || !toc.contains(link)) return;

		if (currentTocLink === link) return;

		if (currentTocLink) {
			currentTocLink.classList.remove("pw-toc-active");
			currentTocLink.removeAttribute("aria-current");
		}

		currentTocLink = link;
		link.classList.add("pw-toc-active");
		link.setAttribute("aria-current", "location");
	}

	function updateActiveToc() {
		if (!toc || !toc.isConnected) return;

		const links = tocLinks();

		const sections = links
			.map(function (link) {
				const heading = headingForTocLink(link);

				if (!heading || !heading.isConnected) {
					return null;
				}

				const rect = heading.getBoundingClientRect();

				if (!rect.height) return null;

				return {
					link: link,
					heading: heading,
					top: rect.top
				};
			})
			.filter(Boolean);

		if (!sections.length) return;

		// Aktywujemy kolejną sekcję, gdy jej nagłówek
		// znajdzie się w górnej części ekranu.
		const activationLine = Math.min(
			320,
			Math.max(180, window.innerHeight * 0.35)
		);

		// Zachowujemy kolejność sekcji
		// w prawym spisie treści.
		let active = sections[0];

		sections.forEach(function (section) {
			if (section.top <= activationLine) {
				active = section;
			}
		});

		if (!active) return;

		// Podświetlenie aktualnej sekcji.
		setActiveToc(active.link);

		// Nie przesuwamy automatycznie prawego menu.
		// Użytkownik może je przewijać swobodnie
		// kółkiem myszy lub paskiem przewijania.
	}

	/* =========================================
	   6. LIGHT, COLLAPSIBLE CODE BLOCKS
	   ========================================= */

	function codeText(pre) {
		const code = pre.querySelector("code");
		if (!code) return "";

		return code.textContent
			.replace(/\u00A0/g, " ")
			.replace(/\n+$/, "");
	}

	function codeLanguage(pre) {
		const code = pre.querySelector("code");
		if (!code) return tr("Kod", "Code");

		const classes = (
			pre.className + " " + code.className
		).toLowerCase();

		const content = codeText(pre);

		if (
			/javascript|language-js\b/.test(classes)
		) return "JavaScript";

		if (
			/powershell|language-ps1|language-pwsh/.test(classes) ||
			/\bTest-NetConnection\b/i.test(content)
		) return "PowerShell";

		if (
			/language-(bash|shell|sh)\b/.test(classes) ||
			/^\s*(curl|sudo|wget|chmod|apt)\b/m.test(content)
		) return "Bash";

		if (/language-json|\bjson\b/.test(classes)) {
			return "JSON";
		}

		if (/language-xml|\bxml\b/.test(classes)) {
			return "XML";
		}

		if (/language-sql|\bsql\b/.test(classes)) {
			return "SQL";
		}

		if (/language-java\b/.test(classes)) {
			return "Java";
		}

		if (/language-python\b/.test(classes)) {
			return "Python";
		}

		return tr("Kod", "Code");
	}

	function makeCodeButton(action, text) {
		const button = el(
			"button",
			"pw-code-v4-btn",
			text
		);

		button.type = "button";
		button.dataset.pwAction = action;

		return button;
	}

	function updateCodeButtonLabels(pre) {
		const collapse = pre.querySelector(
			'[data-pw-action="collapse"]'
		);

		const wrap = pre.querySelector(
			'[data-pw-action="wrap"]'
		);

		if (collapse) {
			const collapsed = pre.classList.contains(
				"pw-code-v4-collapsed"
			);

			collapse.textContent = collapsed
				? tr("Rozwiń", "Expand")
				: tr("Zwiń", "Collapse");

			collapse.setAttribute(
				"aria-expanded",
				String(!collapsed)
			);

			collapse.title = collapsed
				? tr("Rozwiń kod", "Expand code")
				: tr("Zwiń kod", "Collapse code");
		}

		if (wrap) {
			const wrapping = pre.classList.contains(
				"pw-code-v4-wrap"
			);

			wrap.textContent = wrapping
				? tr("Bez zawijania", "No wrap")
				: tr("Zawijaj", "Wrap");

			wrap.setAttribute(
				"aria-pressed",
				String(wrapping)
			);
		}
	}

	function removeOriginalCopyButtons(pre) {
		/*
		 * Platforma może dodawać kolejne przyciski
		 * nawet po wcześniejszym uruchomieniu skryptu.
		 *
		 * Usuwamy tylko jej bezpośrednie przyciski
		 * z PRE, a nie nasze nowe kontrolki.
		 */

		pre.querySelectorAll(
			":scope > button.copy-button, " +
			":scope > button.copy-to-clipboard"
		).forEach(function (button) {
			button.remove();
		});
	}

	function enhanceCode(pre) {
		if (!pre || !pre.isConnected) return;

		// Nie modyfikuj kodu w elementach interfejsu.
		// Tabele oraz rozwijane sekcje są obsługiwane.
		if (
			pre.closest("form, #page_toc, #ui-side-nav")
		) {
			return;
		}

		// Obsługuje:
		// <pre><code>...</code></pre>
		// <pre><span><code>...</code></span></pre>
		const code = pre.querySelector(
			":scope > code, :scope > span > code"
		);

		if (!code) return;

		// Nie nakładaj dwóch różnych paneli na ten sam kod.
		if (pre.closest(".pw-re2-panel")) return;

		// Usuwaj stare przyciski również wtedy,
		// gdy platforma doda je ponownie.
		removeOriginalCopyButtons(pre);

		// Wykryj, czy blok jest wewnątrz rozwijanej sekcji.
		const expandable = pre.closest(
			".inner-body, [id^='tg-'], details"
		);

		if (expandable) {
			pre.classList.add("pw-code-in-expandable");
		}

		// Ogranicz szerokość bez zmieniania treści CODE.
		pre.style.setProperty("max-width", "100%");
		pre.style.setProperty("min-width", "0");
		pre.style.setProperty("box-sizing", "border-box");

		// Nie zmieniaj wcięć, pustych wierszy
		// ani elementów highlight.js.
		code.style.setProperty("max-width", "100%");
		code.style.setProperty("box-sizing", "border-box");

		// Neutralna etykieta dla niejednoznacznych
		// fragmentów, np. konfiguracji zawierających XML.
		function detectLanguage() {
			const classes = (
				pre.className + " " + code.className
			).toLowerCase();

			const content = code.textContent || "";

			if (/language-(sql)\b/.test(classes)) {
				return "SQL";
			}

			if (/language-(javascript|js)\b/.test(classes)) {
				return "JavaScript";
			}

			if (/language-(json)\b/.test(classes)) {
				return "JSON";
			}

			if (/language-(xml)\b/.test(classes)) {
				return "XML";
			}

			if (
				/language-(powershell|ps1|pwsh)\b/.test(classes)
			) {
				return "PowerShell";
			}

			if (/language-(python|py)\b/.test(classes)) {
				return "Python";
			}

			if (/language-(bash|shell|sh)\b/.test(classes)) {
				// Jeśli treść nie przypomina poleceń
				// powłoki, użyj neutralnej etykiety.
				const looksLikeShell =
					/^\s*(?:\$|#\s*!|sudo\b|curl\b|wget\b|cd\b|ls\b|echo\b|export\b|apt\b|docker\b|chmod\b|grep\b)/m
						.test(content);

				return looksLikeShell
					? "Bash"
					: tr("Kod", "Code");
			}

			return codeLanguage(pre);
		}

		const language = detectLanguage();

		// Jeśli blok był już przygotowany,
		// nie dodawaj ponownie przycisków.
		if (pre.classList.contains("pw-code-v4")) {
			const languageLabel = pre.querySelector(
				":scope > .pw-code-v4-lang"
			);

			if (languageLabel) {
				languageLabel.textContent = language;
			}

			updateCodeButtonLabels(pre);
			return;
		}

		// Aktywuj obecny wygląd V4/V5.
		pre.classList.add("pw-code-v4");

		// Domyślnie kod jest rozwinięty i zawijany.
		pre.classList.add("pw-code-v4-wrap");
		pre.classList.remove("pw-code-v4-collapsed");

		const lang = el(
			"span",
			"pw-code-v4-lang",
			language
		);

		const actions = el(
			"span",
			"pw-code-v4-actions"
		);

		const collapse = makeCodeButton(
			"collapse",
			tr("Zwiń", "Collapse")
		);

		const wrap = makeCodeButton(
			"wrap",
			tr("Bez zawijania", "No wrap")
		);

		const copy = makeCodeButton(
			"copy",
			tr("Kopiuj", "Copy")
		);

		[[collapse, "pw-code-v4-collapsed"], [wrap, "pw-code-v4-wrap"]]
			.forEach(([button, className]) => {
				button.addEventListener("click", () => {
					pre.classList.toggle(className);
					updateCodeButtonLabels(pre);
				});
			});

		// KOPIUJ — zachowaj dokładne wcięcia
		// i puste linie z oryginalnego CODE.
		copy.addEventListener("click", async function () {
			try {
				const originalText = code.textContent || "";

				await copyText(
					originalText.replace(/\u00A0/g, " ")
				);

				copy.textContent = tr(
					"Skopiowano ✓",
					"Copied ✓"
				);
			} catch (_) {
				copy.textContent = tr(
					"Błąd kopiowania",
					"Copy failed"
				);
			}

			setTimeout(function () {
				if (copy.isConnected) {
					copy.textContent = tr("Kopiuj", "Copy");
				}
			}, 1700);
		});

		actions.append(collapse, wrap, copy);
		pre.append(lang, actions);

		// Ponownie usuń przyciski platformy.
		removeOriginalCopyButtons(pre);

		updateCodeButtonLabels(pre);
	}

	function updateCodeBlocks() {
		const root = document.querySelector(ARTICLE);
		if (!root) return;

		root.querySelectorAll("pre").forEach(enhanceCode);
	}

/* =========================================
   PLUSWORKFLOW — COMPACT VERTICAL LIST V1
   ========================================= */

function initVerticalArticleListStyles() {
  addStyle("pw-compact-list-v1", `
    /* ========================================= PLUSWORKFLOW — COMPACT ARTICLE LIST Final unified styles ========================================= */
    /* 1. GŁÓWNE LISTY */
    .ui-page-cList-wrap .content_list_main,
    .content_topic_title.tripple > .content_node,
    .content_topic_title.double > .content_node {
      display: flex !important;
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 9px !important;
      width: 100% !important;
      max-width: 850px !important;
      min-width: 0 !important;
      margin: 0 auto 0 0 !important;
      text-align: left !important;
      box-sizing: border-box !important;
    }
    /* 2. KAFELKI */
    .ui-page-cList-wrap .content_list_main > .content_node,
    .content_topic_title.tripple > .content_node > .root_node,
    .content_topic_title.double > .content_node > .root_node {
      display: flex !important;
      flex-direction: column !important;
      align-items: stretch !important;
      float: none !important;
      width: 100% !important;
      min-width: 0 !important;
      min-height: 0 !important;
      height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #FFFFFF !important;
      border: 1px solid #E2E8F0 !important;
      border-radius: 11px !important;
      box-shadow: 0 2px 8px rgba(15,23,42,.035) !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
    }
    .ui-page-cList-wrap .content_list_main > .content_node:hover,
    .content_topic_title.tripple > .content_node > .root_node:hover,
    .content_topic_title.double > .content_node > .root_node:hover {
      border-color: #FDBA74 !important;
    }
    /* 3. NAGŁÓWEK FOLDERU */
    .ui-page-cList-wrap .content_list_main
      > .content_node > .root_node {
      display: block !important;
      position: static !important;
      float: none !important;
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 12px 16px 8px !important;
      background: transparent !important;
      background-image: none !important;
      box-sizing: border-box !important;
    }
    .ui-page-cList-wrap .content_list_main
      > .content_node > .root_node > span {
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      width: 100% !important;
      min-width: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    /* 4. IKONA FOLDERU / ARTYKUŁU */
    .ui-page-cList-wrap .content_list_main
      > .content_node > .root_node > span::before {
      content: "▤";
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      flex: 0 0 32px;
      width: 32px;
      height: 32px;
      background: #FFF7ED;
      color: #D97706;
      border-radius: 8px;
      font-size: 19px;
      line-height: 1;
    }
    .ui-page-cList-wrap .content_list_main
      > .content_node > .root_node.clist_folder
      > span::before {
      content: "▣";
    }
    /* 5. TYTUŁY */
    .ui-page-cList-wrap .content_list_main
      > .content_node > .root_node a,
    .content_topic_title.tripple .root_node a.page_link,
    .content_topic_title.double .root_node a.page_link {
      position: static !important;
      color: #334155 !important;
      font: 600 13px/1.5 Tahoma, Geneva, sans-serif !important;
      text-decoration: none !important;
      text-align: left !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
    }
    .ui-page-cList-wrap .content_list_main
      > .content_node > .root_node a:hover {
      color: #B45309 !important;
    }
    /* 6. ARTYKUŁY PODRZĘDNE */
    .ui-page-cList-wrap .content_list_main
      > .content_node > .sub_node {
      display: block !important;
      position: relative !important;
      float: none !important;
      clear: both !important;
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 14px 0 18px !important;
      box-sizing: border-box !important;
      text-align: left !important;
    }
    /* Bez pionowej linii i starych kropek */
    .ui-page-cList-wrap .content_list_main
      > .content_node > .sub_node::before,
    .ui-page-cList-wrap .content_list_main
      > .content_node > .sub_node
      .node_link > span::before {
      content: none !important;
      display: none !important;
    }
    /* Obsługa Show more */
    .ui-page-cList-wrap .content_list_main
      > .content_node > .sub_node.pw-list-hidden {
      display: none !important;
    }
    /* 7. WEWNĘTRZNY UKŁAD LINKÓW */
    .ui-page-cList-wrap .content_list_main
      > .content_node > .sub_node .node_link,
    .ui-page-cList-wrap .content_list_main
      > .content_node > .sub_node .node_link > span {
      display: block !important;
      position: static !important;
      float: none !important;
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      background: transparent !important;
      background-image: none !important;
      box-sizing: border-box !important;
    }
    /* 8. WYGLĄD WIERSZA ARTYKUŁU */
    .ui-page-cList-wrap .content_list_main
      > .content_node > .sub_node a {
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      position: relative !important;
      float: none !important;
      width: 100% !important;
      min-height: 34px !important;
      height: auto !important;
      margin: 2px 0 !important;
      padding: 7px 10px !important;
      background: #F8FAFC !important;
      border-radius: 7px !important;
      color: #526174 !important;
      font: 400 12px/1.45 Tahoma, Geneva, sans-serif !important;
      text-decoration: none !important;
      text-align: left !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      box-sizing: border-box !important;
      transition: background .15s ease, color .15s ease;
    }
    /* Ikona dokumentu */
    .ui-page-cList-wrap .content_list_main
      > .content_node > .sub_node a::before {
      content: "▤";
      flex: 0 0 auto;
      color: #D97706;
      font-size: 14px;
      line-height: 1;
    }
    /* Strzałka po prawej */
    .ui-page-cList-wrap .content_list_main
      > .content_node > .sub_node a::after {
      content: "›";
      flex: 0 0 auto;
      margin-left: auto;
      color: #B3BCC9;
      font-size: 18px;
      line-height: 1;
    }
    /* Hover */
    .ui-page-cList-wrap .content_list_main
      > .content_node > .sub_node a:hover {
      background: #FFF7ED !important;
      color: #B45309 !important;
    }
    /* 9. ODSTĘP POD OSTATNIM LINKIEM Gdy nie ma stopki Show more */
    .ui-page-cList-wrap .content_list_main
      > .content_node
      > .sub_node:last-child:not(.pw-list-hidden) {
      padding-bottom: 14px !important;
    }
    /* 10. PRZYCISK SHOW MORE */
    .ui-page-cList-wrap .content_list_main
      > .content_node > .pw-list-footer {
      display: block !important;
      position: static !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 8px 14px 13px 18px !important;
      box-sizing: border-box !important;
      text-align: left !important;
    }
    .ui-page-cList-wrap .content_list_main
      > .content_node .pw-list-more {
      display: inline-block !important;
      background: transparent !important;
      border: 0 !important;
      border-radius: 7px !important;
      padding: 6px 8px !important;
      color: #B45309 !important;
      font: 600 11px/1.4 Tahoma, Geneva, sans-serif !important;
      cursor: pointer !important;
    }
    .ui-page-cList-wrap .content_list_main
      > .content_node .pw-list-more:hover {
      background: #FFF7ED !important;
    }
    .ui-page-cList-wrap .content_list_main
      > .content_node .pw-list-more:focus-visible,
    .ui-page-cList-wrap .content_list_main
      > .content_node a:focus-visible {
      outline: 2px solid #D97706 !important;
      outline-offset: 2px !important;
    }
    /* 11. PROSTE LISTY ARTYKUŁÓW */
    .content_topic_title.tripple .root_main_node,
    .content_topic_title.double .root_main_node {
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      width: 100% !important;
      height: auto !important;
      margin: 0 !important;
      padding: 13px 16px !important;
      box-sizing: border-box !important;
    }
    .content_topic_title.tripple .root_node_topic_title,
    .content_topic_title.double .root_node_topic_title {
      flex: 1 1 auto !important;
      min-width: 0 !important;
    }
    /* 12. DARK MODE */
    html.pw-dark-mode
    .ui-page-cList-wrap .content_list_main > .content_node,
    html.pw-dark-mode
    .content_topic_title.tripple > .content_node > .root_node,
    html.pw-dark-mode
    .content_topic_title.double > .content_node > .root_node {
      background: #202631 !important;
      border-color: #394250 !important;
    }
    html.pw-dark-mode
    .ui-page-cList-wrap .content_list_main
      > .content_node > .root_node a,
    html.pw-dark-mode
    .content_topic_title .root_node a.page_link {
      color: #E8EDF5 !important;
    }
    html.pw-dark-mode
    .ui-page-cList-wrap .content_list_main
      > .content_node > .sub_node a {
      background: #29313E !important;
      color: #CBD5E1 !important;
    }
    html.pw-dark-mode
    .ui-page-cList-wrap .content_list_main
      > .content_node > .sub_node a:hover {
      background: #3C3029 !important;
      color: #FDBA74 !important;
    }
    html.pw-dark-mode
    .ui-page-cList-wrap .content_list_main
      > .content_node .pw-list-more {
      color: #FDBA74 !important;
    }
    html.pw-dark-mode
    .ui-page-cList-wrap .content_list_main
      > .content_node .pw-list-more:hover {
      background: #3C3029 !important;
    }
    /* 13. MOBILE */
    @media (max-width: 600px) {
      .ui-page-cList-wrap .content_list_main,
      .content_topic_title.tripple > .content_node,
      .content_topic_title.double > .content_node {
        max-width: 100% !important;
      }
      .ui-page-cList-wrap .content_list_main
        > .content_node > .sub_node {
        padding-left: 12px !important;
        padding-right: 12px !important;
      }
      .ui-page-cList-wrap .content_list_main
        > .content_node > .pw-list-footer {
        padding-left: 12px !important;
      }
    }
    /* 14. REDUCED MOTION */
    @media (prefers-reduced-motion: reduce) {
      .ui-page-cList-wrap .content_list_main
        > .content_node > .sub_node a {
        transition: none !important;
      }
    }
  `);
}

function updateVerticalArticleLists() {
  const limit = 3;

  document.querySelectorAll(
    ".ui-page-cList-wrap .content_list_main > .content_node"
  ).forEach(function (card) {
    const children = Array.from(card.children).filter(
      node => node.classList.contains("sub_node")
    );

    const expanded = card.classList.contains("pw-list-expanded");

    children.forEach(function (child, index) {
      const hidden = !expanded && index >= limit;

      if (child.classList.contains("pw-list-hidden") !== hidden) {
        child.classList.toggle("pw-list-hidden", hidden);
      }
    });

    let footer = Array.from(card.children).find(
      node => node.classList.contains("pw-list-footer")
    );

    if (children.length <= limit) {
      if (footer) footer.remove();
      return;
    }

    if (!footer) {
      footer = document.createElement("div");
      footer.className = "pw-list-footer";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "pw-list-more";

      button.addEventListener("click", function () {
        card.classList.toggle("pw-list-expanded");
        updateVerticalArticleLists();
      });

      footer.appendChild(button);
      card.appendChild(footer);
    }

    const button = footer.querySelector(".pw-list-more");
    const remaining = children.length - limit;

    const label = expanded
      ? tr("Pokaż mniej ↑", "Show less ↑")
      : tr(
          "Pokaż więcej (" + remaining + ") ↓",
          "Show more (" + remaining + ") ↓"
        );

    if (button.textContent !== label) {
      button.textContent = label;
    }

    button.setAttribute("aria-expanded", String(expanded));
  });
}

	/* =========================================
	   7. LEFT DOCUMENTATION TREE FILTER V2
	   PL + EN / fuzzy search / no API key
	   ========================================= */

	function initTreeFilterStyles() {
		addStyle("pw-tree-filter-v2-styles", `
			#ui-side-nav.pw-tree-filter-ready > .ui-toc-tree {
				height: calc(100% - 82px) !important;
				min-height: 0;
			}
			#ui-side-nav .pw-tree-filter {
				--pw-filter-bg: #FFFFFF;
				--pw-filter-field: #F8FAFC;
				--pw-filter-border: #E2E8F0;
				--pw-filter-text: #334155;
				--pw-filter-muted: #64748B;
				box-sizing: border-box;
				height: 82px;
				padding: 11px 10px 7px;
				background: var(--pw-filter-bg);
				border-bottom: 1px solid var(--pw-filter-border);
				font: 12px/1.4 Tahoma, Geneva, sans-serif;
			}
			#ui-side-nav .pw-tree-filter-field {
				display: flex;
				align-items: center;
				gap: 7px;
				height: 34px;
				padding: 0 8px;
				border: 1px solid var(--pw-filter-border);
				border-radius: 8px;
				background: var(--pw-filter-field);
				box-sizing: border-box;
				color: var(--pw-filter-muted);
			}
			#ui-side-nav .pw-tree-filter-field:focus-within {
				border-color: #D97706;
				box-shadow: 0 0 0 2px rgba(217,119,6,.16);
			}
			#ui-side-nav .pw-tree-filter-icon { flex: 0 0 15px; width: 15px; height: 15px; }
			#ui-side-nav .pw-tree-filter-input {
				flex: 1 1 0%; min-width: 0; width: 0;
				border: 0 !important; outline: 0 !important;
				background: transparent !important;
				padding: 0 !important; margin: 0 !important;
				color: var(--pw-filter-text) !important;
				font: 12px/1.4 Tahoma, Geneva, sans-serif !important;
				box-shadow: none !important;
			}
			#ui-side-nav .pw-tree-filter-input::placeholder { color: var(--pw-filter-muted); opacity: 1; }
			#ui-side-nav .pw-tree-filter-clear {
				flex: 0 0 24px; width: 24px; height: 26px;
				border: 0; border-radius: 5px; background: transparent;
				color: var(--pw-filter-muted); cursor: pointer;
				font: 20px/1 Tahoma, sans-serif; padding: 0;
			}
			#ui-side-nav .pw-tree-filter-clear[hidden] { display: none !important; }
			#ui-side-nav .pw-tree-filter-clear:hover { background: rgba(217,119,6,.12); color: #B45309; }
			#ui-side-nav .pw-tree-filter-clear:focus-visible { outline: 2px solid #D97706 !important; }
			#ui-side-nav .pw-tree-filter-status {
				margin-top: 4px; color: var(--pw-filter-muted);
				font: 10px/1.4 Tahoma, Geneva, sans-serif;
				overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
			}
			#ui-side-nav .pw-tree-filter-hint {
				color: var(--pw-filter-muted); font: 10px/1.4 Tahoma, Geneva, sans-serif;
				overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
			}
			#ui-side-nav .pw-tree-filter-hidden { display: none !important; }
			#ui-side-nav .pw-tree-filter-match:not(.active) { background: #FFF7ED !important; }
			#ui-side-nav .pw-tree-filter-match:not(.active) .TreeListcontent > a span { color: #92400E !important; }
			html.pw-dark-mode #ui-side-nav .pw-tree-filter {
				--pw-filter-bg: #202631; --pw-filter-field: #29313E;
				--pw-filter-border: #465160; --pw-filter-text: #E8EDF5;
				--pw-filter-muted: #CBD5E1;
			}
			html.pw-dark-mode #ui-side-nav .pw-tree-filter-match:not(.active) { background: #3C3029 !important; }
			html.pw-dark-mode #ui-side-nav .pw-tree-filter-match:not(.active) .TreeListcontent > a span { color: #FDBA74 !important; }
		`);
	}

	// NFD nie usuwa litery ł, dlatego obsługujemy ją oddzielnie.
	function treeSearchNormalize(value) {
		return String(value || "").toLowerCase()
			.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
			.replace(/ł/g, "l").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
	}

	// Optimal String Alignment: wstawienie, usunięcie, zamiana oraz przestawienie sąsiednich liter.
	function treeSearchDistance(a, b) {
		const d = Array.from({length: a.length + 1}, () => new Array(b.length + 1).fill(0));
		for (let i = 0; i <= a.length; i++) d[i][0] = i;
		for (let j = 0; j <= b.length; j++) d[0][j] = j;
		for (let i = 1; i <= a.length; i++) {
			for (let j = 1; j <= b.length; j++) {
				d[i][j] = Math.min(d[i-1][j]+1, d[i][j-1]+1, d[i-1][j-1]+(a[i-1] === b[j-1] ? 0 : 1));
				if (i > 1 && j > 1 && a[i-1] === b[j-2] && a[i-2] === b[j-1]) {
					d[i][j] = Math.min(d[i][j], d[i-2][j-2]+1);
				}
			}
		}
		return d[a.length][b.length];
	}

	function treeSearchTokenMatch(token, word) {
		if (word.includes(token)) return true;
		// Krótkie skróty, np. API, SQL i HA, pozostają dokładne.
		const limit = token.length < 4 ? 0 : token.length < 8 ? 1 : 2;
		if (!limit || word.length < token.length - limit) return false;
		if (Math.abs(word.length - token.length) <= limit && treeSearchDistance(token, word) <= limit) return true;
		// Pozwala wyszukiwać w trakcie wpisywania dłuższej nazwy.
		if (word.length > token.length && token.length >= 5) {
			return treeSearchDistance(token, word.slice(0, token.length)) <= limit;
		}
		return false;
	}

	function treeSearchMatches(title, query) {
		if (!query) return true;
		if (title.includes(query)) return true;
		const words = title.split(" ");
		return query.split(" ").every(token => words.some(word => treeSearchTokenMatch(token, word)));
	}

	let treeFilterState = null;
	let treeFilterValue = "";
	let treeFilterLanguage = null;
	let treeFilterTimer = 0;
	const TREE_SCAN_LIMIT = 250;
	const TREE_SCAN_DELAY = 300;
	const TREE_SCAN_TIMEOUT = 3500;
	const treePause = ms => new Promise(resolve => setTimeout(resolve, ms));

	// Platforma renderuje drzewo jako płaską listę wierszy.
	// Nie odtwarzamy drzewa ani nie pobieramy danych z prywatnego API.
	// Klikamy wyłącznie natywną ikonę zamkniętego folderu.
	function treeScanValid(state, job) {
		return treeFilterState === state && state.tree.isConnected &&
			state.scan === job && Boolean(treeSearchNormalize(treeFilterValue)) &&
			job.path === location.pathname;
	}

	function stopTreeScan(state) {
		if (state) state.scan = null;
	}

	function startTreeScan(state) {
		if (!state || !treeSearchNormalize(treeFilterValue)) return;
		if (state.scan && state.scan.path === location.pathname) return;
		const job = { path: location.pathname, tried: new Set(), failed: 0,
			opened: 0, running: true, limited: false };
		state.scan = job;
		(async function () {
			try {
				while (treeScanValid(state, job)) {
					const folders = Array.from(state.tree.querySelectorAll(
						'.o2xp-tree-view .TreeListcontent.folder-ct[id]'));
					const folder = folders.find(node => !job.tried.has(node.id) &&
						node.querySelector('.folder_icons_toc1'));
					if (!folder) {
						// Daj platformie czas na dociągnięcie ostatnich dzieci.
						await treePause(600);
						if (!treeScanValid(state, job)) return;
						const pending = Array.from(state.tree.querySelectorAll(
							'.o2xp-tree-view .TreeListcontent.folder-ct[id]')).some(node =>
							!job.tried.has(node.id) && node.querySelector('.folder_icons_toc1'));
						if (pending) continue;
						break;
					}
					if (job.tried.size >= TREE_SCAN_LIMIT) { job.limited = true; break; }
					const id = folder.id;
					job.tried.add(id);
					const icon = folder.querySelector('.folder_icons_toc1');
					if (!icon || !icon.isConnected) continue;
					icon.click();
					const deadline = Date.now() + TREE_SCAN_TIMEOUT;
					let expanded = false;
					while (treeScanValid(state, job) && Date.now() < deadline) {
						await treePause(100);
						const current = document.getElementById(id);
						if (current && state.tree.contains(current) &&
							current.querySelector('.folder_icons_toc1_expanded')) {
							expanded = true;
							break;
						}
					}
					if (!treeScanValid(state, job)) return;
					if (expanded) job.opened++; else job.failed++;
					renderTreeFilter();
					await treePause(TREE_SCAN_DELAY);
				}
			} catch (error) {
				job.failed++;
				console.warn('[PlusWorkflow] Tree scan:', error);
			} finally {
				job.running = false;
				if (treeScanValid(state, job)) renderTreeFilter();
			}
		})();
	}


	function renderTreeFilter() {
		const state = treeFilterState;
		if (!state || !state.tree.isConnected) return;
		const query = treeSearchNormalize(treeFilterValue);
		let count = 0;
		const rows = state.tree.querySelectorAll(".o2xp-tree-view .list-view.x-tree-node");
		rows.forEach(row => {
			const content = row.querySelector(":scope > .TreeListcontent");
			const anchor = content && content.querySelector(":scope > a");
			if (!anchor) return;
			const title = treeSearchNormalize(anchor.textContent);
			const folder = content.classList.contains("folder-ct");
			const match = Boolean(query && treeSearchMatches(title, query));
			if (match) count++;
			// Foldery zachowujemy, również gdy nie pasują: ich dzieci mogą być ładowane dopiero po rozwinięciu.
			row.classList.toggle("pw-tree-filter-hidden", Boolean(query && !match && !folder));
			row.classList.toggle("pw-tree-filter-match", match);
		});
		const job = state.scan;
		const scanning = query && job && job.running;
		const incomplete = query && job && !job.running && (job.failed || job.limited);
		const message = query ? (count || scanning ? tr("Wyniki: ", "Matches: ") + count : tr("Brak dopasowań", "No matches")) : tr("Filtr nazw w menu", "Filter navigation titles");
		const hint = scanning ? tr("Przeszukuję foldery… ", "Scanning folders… ") + job.opened :
			incomplete ? tr("Część folderów nie została wczytana", "Some folders could not be loaded") :
			query && job ? tr("Przeszukano dostępne foldery", "Available folders scanned") :
			tr("Wyszukuje także w zwiniętych folderach", "Searches collapsed folders too");
		if (state.hint.textContent !== hint) state.hint.textContent = hint;
		state.hint.title = hint;
		if (state.status.textContent !== message) state.status.textContent = message;
		state.clear.hidden = !treeFilterValue;
	}

	function scheduleTreeFilter() {
		clearTimeout(treeFilterTimer);
		treeFilterTimer = setTimeout(() => {
			const state = treeFilterState;
			if (state && treeSearchNormalize(treeFilterValue)) startTreeScan(state);
			else stopTreeScan(state);
			renderTreeFilter();
		}, 180);
	}

	function updateTreeFilter() {
		const nav = document.getElementById("ui-side-nav");
		const tree = nav && nav.querySelector(":scope > .ui-toc-tree");
		const language = isEN() ? "en" : "pl";
		if (treeFilterLanguage !== language) {
			treeFilterValue = "";
			treeFilterLanguage = language;
		}
		if (treeFilterState && (treeFilterState.tree !== tree || !treeFilterState.panel.isConnected || treeFilterState.panel.parentElement !== nav)) {
			const old = treeFilterState;
			stopTreeScan(old);
			old.observer.disconnect();
			old.tree.querySelectorAll(".pw-tree-filter-hidden, .pw-tree-filter-match").forEach(row => row.classList.remove("pw-tree-filter-hidden", "pw-tree-filter-match"));
			old.nav.classList.remove("pw-tree-filter-ready");
			old.panel.remove();
			treeFilterState = null;
		}
		if (!tree || !tree.querySelector(".o2xp-tree-view")) return;
		if (!treeFilterState) {
			const panel = el("div", "pw-tree-filter");
			panel.setAttribute("role", "search");
			const field = el("div", "pw-tree-filter-field");
			const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			icon.setAttribute("class", "pw-tree-filter-icon");
			icon.setAttribute("viewBox", "0 0 24 24");
			icon.setAttribute("aria-hidden", "true");
			icon.setAttribute("fill", "none");
			icon.setAttribute("stroke", "currentColor");
			icon.setAttribute("stroke-width", "2");
			icon.innerHTML = '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5" stroke-linecap="round"/>';
			const input = el("input", "pw-tree-filter-input");
			input.type = "text";
			input.autocomplete = "off";
			input.spellcheck = false;
			input.maxLength = 100;
			input.value = treeFilterValue;
			const clear = el("button", "pw-tree-filter-clear", "×");
			clear.type = "button";
			const status = el("div", "pw-tree-filter-status");
			status.setAttribute("role", "status");
			status.setAttribute("aria-live", "polite");
			const hint = el("div", "pw-tree-filter-hint");
			field.append(icon, input, clear);
			panel.append(field, status, hint);
			nav.insertBefore(panel, tree);
			nav.classList.add("pw-tree-filter-ready");
			function reset() {
				clearTimeout(treeFilterTimer);
				input.value = treeFilterValue = "";
				stopTreeScan(treeFilterState);
				renderTreeFilter();
				input.focus();
			}
			input.addEventListener("input", () => {
				treeFilterValue = input.value;
				clear.hidden = !treeFilterValue;
				if (!treeSearchNormalize(treeFilterValue)) stopTreeScan(treeFilterState);
				scheduleTreeFilter();
			});
			input.addEventListener("keydown", event => {
				if (event.key === "Escape" && treeFilterValue) { event.preventDefault(); event.stopPropagation(); reset(); }
				if (event.key === "Enter") event.preventDefault();
			});
			clear.addEventListener("click", reset);
			const observer = new MutationObserver(scheduleTreeFilter);
			observer.observe(tree, { childList: true, subtree: true, characterData: true });
			treeFilterState = { nav, tree, panel, input, clear, status, hint, observer };
		}
		const s = treeFilterState;
		if (s.input.value !== treeFilterValue) s.input.value = treeFilterValue;
		const placeholder = tr("Filtruj menu…", "Filter navigation…");
		const label = tr("Filtruj nazwy w menu dokumentacji", "Filter documentation navigation titles");
		
		if (s.input.placeholder !== placeholder) s.input.placeholder = placeholder;
		s.input.setAttribute("aria-label", label);
		s.panel.setAttribute("aria-label", label);
		s.clear.setAttribute("aria-label", tr("Wyczyść filtr", "Clear filter"));
		s.clear.title = tr("Wyczyść filtr", "Clear filter");
		if (s.scan && s.scan.path !== location.pathname) stopTreeScan(s);
		if (treeSearchNormalize(treeFilterValue)) startTreeScan(s);
		else stopTreeScan(s);
		renderTreeFilter();
	}

	/* =========================================
	   8. SPA / EXTJS — GLOBAL REFRESH
	   ========================================= */

	function refresh() {
		refreshPending = false;

		updateImages();
		updateCodeBlocks();
		updateToc();
		updateVerticalArticleLists();
		updateTreeFilter();

		positionLanguage();
		positionRecent();

		if (location.pathname !== lastPath) {
			lastPath = location.pathname;

			if (recentPanel) {
				recentPanel.classList.remove("pw-open");
			}

			setTimeout(rememberArticle, 350);
		}
	}

	function scheduleRefresh() {
		if (refreshPending) return;

		refreshPending = true;
		requestAnimationFrame(refresh);
	}

	let scrollPending = false;

	function onScroll() {
		if (scrollPending) return;

		scrollPending = true;

		requestAnimationFrame(function () {
			scrollPending = false;

			updateActiveToc();
			positionLanguage();
			positionRecent();
		});
	}

	function init() {
		initLanguage();
		initRecent();
		initVerticalArticleListStyles();
		initTreeFilterStyles();

		refresh();

		setTimeout(rememberArticle, 350);

		/*
		 * Jedna obserwacja zamiast kilku
		 * niezależnych obserwatorów całego DOM.
		 */

		const direct = "#ui-side-nav, .ui-toc-tree, .o2xp-tree-view, button.copy-button, button.copy-to-clipboard, #topic-content, #page_toc, pre, code, img, h1, h2, h3";
		const nested = "#ui-side-nav, .ui-toc-tree, .o2xp-tree-view, #topic-content, #page_toc, pre, code, img";
		const observer = new MutationObserver(mutations => {
			const relevant = mutations.some(m => m.type === "childList" &&
				Array.from(m.addedNodes).some(node => node.nodeType === 1 && (
					(node.matches && node.matches(direct)) ||
					(node.querySelector && node.querySelector(nested))
				)));
			if (relevant) scheduleRefresh();
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true
		});

		document.addEventListener(
			"scroll",
			onScroll,
			{ passive: true, capture: true }
		);

		["resize", "pageshow", "popstate", "hashchange"].forEach(event =>
			window.addEventListener(event, scheduleRefresh)
		);

		document.addEventListener("click", function (event) {
			const link = event.target.closest(
				"#page_toc li > a[href]"
			);

			if (!link) return;

			setActiveToc(link);

			setTimeout(updateActiveToc, 800);
		});

		/*
		 * Sprawdzanie zmian URL przy nawigacji SPA,
		 * bez nadpisywania history.pushState
		 * używanego przez inne skrypty.
		 */

		setInterval(function () {
			if (location.pathname !== lastPath) {
				scheduleRefresh();
			}
		}, 700);

		setTimeout(scheduleRefresh, 500);
		setTimeout(scheduleRefresh, 1400);
	}

	if (document.readyState === "loading") {
		document.addEventListener(
			"DOMContentLoaded",
			init,
			{ once: true }
		);
	} else {
		init();
	}

})();
