(() => {
  "use strict";

  const R = window.AD_RULES;
  const I18N = window.I18N;
  const RANK = { ok: 0, info: 1, warn: 2, error: 3 };
  const RANK_NAME = ["ok", "info", "warn", "error"];
  const STORE_KEY = "ad-copy-checker:v1";
  const THEME_KEY = "ad-copy-checker:theme";
  const LANG_KEY = "ad-copy-checker:lang";
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  // ---------------------------------------------------------------
  // 保存（保存領域が使えない環境でも動くよう、すべて try/catch）
  // ---------------------------------------------------------------
  const load = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const store = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* noop */ } };

  // 入力内容は項目キーごとに保存。媒体を切り替えても引き継がれる
  let state = { media: Object.keys(R.media)[0], texts: {} };
  try {
    const saved = JSON.parse(load(STORE_KEY) || "null");
    if (saved && R.media[saved.media]) state = { media: saved.media, texts: saved.texts || {} };
  } catch (e) { /* noop */ }
  const save = () => store(STORE_KEY, JSON.stringify(state));

  // 言語・テーマ（既定は英語・ダーク）
  let lang = load(LANG_KEY) === "ja" ? "ja" : "en";
  let theme = load(THEME_KEY) === "light" ? "light" : "dark";
  const t = () => I18N[lang];
  const L = (v) => (v && typeof v === "object" ? v[lang] ?? v.en : v); // { en, ja } → 表示中の言語

  // ---------------------------------------------------------------
  // 文字数
  // ---------------------------------------------------------------
  function cpWidth(cp) {
    if (cp >= 0xff61 && cp <= 0xff9f) return 1; // 半角カナ
    if (
      (cp >= 0x1100 && cp <= 0x115f) ||
      (cp >= 0x2e80 && cp <= 0xa4cf) ||
      (cp >= 0xac00 && cp <= 0xd7a3) ||
      (cp >= 0xf900 && cp <= 0xfaff) ||
      (cp >= 0xfe30 && cp <= 0xfe4f) ||
      (cp >= 0xff00 && cp <= 0xff60) ||
      (cp >= 0xffe0 && cp <= 0xffe6) ||
      cp >= 0x1f000
    ) return 2;
    return 1;
  }

  // count と、上限を超え始める位置（文字列のインデックス）を返す
  function measure(text, mode, limit) {
    let total = 0;
    let overflowAt = -1;
    let i = 0;
    for (const ch of text) {
      total += mode === "width" ? cpWidth(ch.codePointAt(0)) : 1;
      if (limit && total > limit && overflowAt < 0) overflowAt = i;
      i += ch.length;
    }
    return { count: total, overflowAt };
  }

  // 照合用：全角英数記号→半角、小文字化（文字列の長さは変えない）
  const fold = (s) =>
    s.replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).toLowerCase();

  function findAll(re, text) {
    const out = [];
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      if (!m[0].length) { re.lastIndex++; continue; }
      out.push([m.index, m.index + m[0].length]);
    }
    return out;
  }

  // ---------------------------------------------------------------
  // 1行ぶんのチェック
  // ---------------------------------------------------------------
  const RE = {
    exclamation: /[!！]/g,
    emoji: /(?![©®™])\p{Extended_Pictographic}️?/gu,
    dependentChars: /[①-⓿Ⅰ-ⅿ❶-➓㈠-㉏㊀-㏿№℡]/g,
    halfKana: /[｡-ﾟ]+/g,
    // 装飾目的の記号：矢印・罫線・図形・その他の記号・装飾記号のブロック全体と ≫ » 〓。
    // 絵文字（emoji）と丸付き数字（dependentChars）は別のチェックで拾うので除外する。
    decorativeSymbols:
      /(?!\p{Extended_Pictographic})[←-⇿─-❵➔-➿⟰-⟿⤀-⥿⬀-⯿≫»〓]/gu,
    repeatedSymbols: /([!！?？。、・〜～~=＝*＊#＃♪★☆（）()])\1+/g,
    phone: /0120-?\d{3}-?\d{3}|0\d{1,4}[-‐ー]\d{1,4}[-‐ー]\d{3,4}|0\d{9,10}/g,
    allCaps: /\b[A-Z]{4,}\b/g,
    edgeSpace: /^[ 　\t]+|[ 　\t]+$/g,
    multiSpace: /[ 　]{2,}/g,
    fullwidthAlnum: /[０-９Ａ-Ｚａ-ｚ]+/g,
  };

  // 括弧の対応を調べる。
  // ・「」【】などは同じ種類の開き・閉じで1組。片方だけ・種類違い・逆向きは bad に入れる。
  // ・丸括弧（）() は片方だけでもよく、組数にも数えない。全角と半角の組み合わせだけ bad。
  const BRACKETS = { "「": "」", "『": "』", "【": "】", "〈": "〉", "《": "》", "〔": "〕", "［": "］", "[": "]", "｛": "｝", "{": "}", "＜": "＞", "<": ">" };
  const CLOSERS = new Set(Object.values(BRACKETS));
  const PARENS = { "（": "）", "(": ")" };

  function checkBrackets(text) {
    const pairs = [];
    const bad = [];
    const stack = [];
    const parens = [];
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (BRACKETS[ch]) {
        stack.push(i);
      } else if (CLOSERS.has(ch)) {
        const top = stack[stack.length - 1];
        if (top !== undefined && BRACKETS[text[top]] === ch) pairs.push([stack.pop(), i]);
        else bad.push([i, i + 1]);
      } else if (PARENS[ch]) {
        parens.push(i);
      } else if (ch === "）" || ch === ")") {
        const top = parens.pop();
        if (top !== undefined && PARENS[text[top]] !== ch) bad.push([top, top + 1], [i, i + 1]);
      }
    }
    for (const i of stack) bad.push([i, i + 1]);
    return { pairs, bad };
  }

  function checkLine(text, field, mediaKey, media) {
    const T = t().issues;
    const issues = [];
    const add = (level, title, note, spans = [], words = []) => issues.push({ level, title, note, spans, words });
    const c = media.checks || {};
    const folded = fold(text);
    const label = L(field.label);

    // 文字数
    const { count, overflowAt } = measure(text, media.countMode, field.limit);
    const over = count - field.limit;
    if (over > 0) {
      if (field.soft) add("warn", T.overSoft[0], T.overSoft[1](field.limit, over));
      else add("error", T.overHard[0], T.overHard[1](over, media.countMode === "width"));
    }

    // 感嘆符
    const exLimit = c.exclamation ? c.exclamation[field.key] : undefined;
    if (exLimit !== undefined && exLimit !== null) {
      const ex = findAll(RE.exclamation, text);
      if (ex.length > exLimit) add("error", T.exclamation[0], T.exclamation[1](label, exLimit, ex.length), ex);
    }

    // 括弧（対応と組数）
    const brLimit = c.brackets ? c.brackets[field.key] : undefined;
    if (brLimit !== undefined && brLimit !== null) {
      const { pairs, bad } = checkBrackets(text);
      if (bad.length) {
        add("error", T.bracketUnpaired[0], T.bracketUnpaired[1], bad, [...new Set(bad.map(([s]) => text[s]))]);
      }
      if (pairs.length > brLimit) {
        const spans = pairs.flatMap(([o, cl]) => [[o, o + 1], [cl, cl + 1]]);
        const words = [...new Set(pairs.map(([o, cl]) => text[o] + text[cl]))];
        add("error", T.bracketPairs[0], T.bracketPairs[1](label, brLimit, pairs.length), spans, words);
      }
    }

    // 表記ルール
    for (const key of ["emoji", "dependentChars", "halfKana", "decorativeSymbols", "repeatedSymbols", "allCaps"]) {
      if (!c[key]) continue;
      const spans = findAll(RE[key], text);
      if (spans.length) add(c[key], T[key][0], T[key][1], spans, spans.map(([s, e]) => text.slice(s, e)));
    }
    if (c.phone) {
      const spans = findAll(RE.phone, folded);
      if (spans.length) add(c.phone, T.phone[0], T.phone[1], spans, spans.map(([s, e]) => text.slice(s, e)));
    }

    // 空白
    if (findAll(RE.edgeSpace, text).length) add("info", T.edgeSpace[0], T.edgeSpace[1]);
    const multi = findAll(RE.multiSpace, text);
    if (multi.length) add("warn", T.multiSpace[0], T.multiSpace[1], multi);

    // 全角英数字（全角=2で数える媒体のみ）
    if (c.fullwidthAlnum && media.countMode === "width") {
      const fw = findAll(RE.fullwidthAlnum, text);
      if (fw.length) {
        const saved = fw.reduce((n, [s, e]) => n + (e - s), 0);
        add("info", T.fullwidthAlnum[0], T.fullwidthAlnum[1](saved), fw, fw.map(([s, e]) => text.slice(s, e)));
      }
    }

    // 注意が必要な表現
    const hits = [];
    for (const rule of R.expressions) {
      if (rule.media && !rule.media.includes(mediaKey)) continue;
      for (const w of rule.words) {
        const fw = fold(w);
        let idx = folded.indexOf(fw);
        while (idx >= 0) {
          hits.push({ s: idx, e: idx + fw.length, rule });
          idx = folded.indexOf(fw, idx + 1);
        }
      }
    }
    // 長い語句に含まれる短い語句（例：「最安値」の中の「最安」）は外す
    const kept = hits.filter(
      (h) => !hits.some((o) => o !== h && o.s <= h.s && o.e >= h.e && o.e - o.s > h.e - h.s)
    );
    const byRule = new Map();
    for (const h of kept) {
      if (!byRule.has(h.rule)) byRule.set(h.rule, []);
      byRule.get(h.rule).push(h);
    }
    for (const [rule, hs] of byRule) {
      const spans = hs.map((h) => [h.s, h.e]);
      const words = [...new Set(spans.map(([s, e]) => text.slice(s, e)))];
      add(rule.level, L(rule.category), L(rule.note), spans, words);
    }

    issues.sort((a, b) => RANK[b.level] - RANK[a.level]);
    const rank = issues.reduce((m, i) => Math.max(m, RANK[i.level]), 0);
    return { text, count, limit: field.limit, overflowAt: over > 0 ? overflowAt : -1, issues, level: RANK_NAME[rank] };
  }

  // 項目（見出しなど）単位のチェック
  function checkField(field, mediaKey, media) {
    const T = t();
    const raw = state.texts[field.key] || "";
    const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== "");
    const rows = lines.map((l) => checkLine(l, field, mediaKey, media));

    // 重複
    const seen = new Map();
    rows.forEach((r, i) => {
      const k = fold(r.text.trim());
      if (seen.has(k)) {
        r.issues.push({ level: "warn", title: T.issues.duplicate[0], note: T.issues.duplicate[1](seen.get(k) + 1), spans: [], words: [] });
        if (RANK[r.level] < RANK.warn) r.level = "warn";
      } else {
        seen.set(k, i);
      }
    });

    const label = L(field.label);
    const notices = [];
    if (field.maxItems && rows.length > field.maxItems) {
      notices.push({ level: "error", text: T.tooMany(label, field.maxItems, rows.length) });
    }
    if (field.minItems && rows.length > 0 && rows.length < field.minItems) {
      notices.push({ level: "info", text: T.tooFew(label, field.minItems, rows.length) });
    }
    return { rows, notices };
  }

  // ---------------------------------------------------------------
  // 表示
  // ---------------------------------------------------------------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function highlight(row) {
    const { text, issues, overflowAt } = row;
    const n = text.length;
    const marks = new Array(n).fill(0);
    for (const is of issues) {
      const r = RANK[is.level];
      for (const [s, e] of is.spans) for (let i = s; i < e && i < n; i++) marks[i] = Math.max(marks[i], r);
    }
    const isOver = (i) => overflowAt >= 0 && i >= overflowAt;
    let html = "";
    let i = 0;
    while (i < n) {
      const m = marks[i];
      const o = isOver(i);
      let j = i + 1;
      while (j < n && marks[j] === m && isOver(j) === o) j++;
      let seg = esc(text.slice(i, j));
      if (m) seg = `<mark class="m-${RANK_NAME[m]}">${seg}</mark>`;
      if (o) seg = `<span class="over" title="${esc(t().overTitle)}">${seg}</span>`;
      html += seg;
      i = j;
    }
    return html;
  }

  function rowHtml(row, idx, media) {
    const T = t();
    const pct = Math.min(row.count / row.limit, 1) * 100;
    const meterCls = row.count > row.limit ? "over" : row.count >= row.limit * 0.9 ? "near" : "";
    const unit = media.countMode === "width" ? T.unitWidth : T.unitChar;
    const q = lang === "ja" ? ["「", "」"] : ["“", "”"];
    const issues = row.issues
      .map((is) => {
        const words = is.words && is.words.length
          ? `<span class="words">${is.words.map((w) => q[0] + esc(w) + q[1]).join(lang === "ja" ? "" : ", ")}</span>`
          : "";
        return `<li class="issue lv-${is.level}"><b>${esc(is.title)}</b>${words}${esc(is.note)}</li>`;
      })
      .join("");
    const okBadge = row.issues.length ? "" : `<span class="ok-badge">${esc(T.noIssues)}</span>`;
    return `<li class="row lv-${row.level}">
      <span class="no">${idx + 1}</span>
      <div class="main">
        <div class="text">${highlight(row)}${okBadge}</div>
        ${issues ? `<ul class="issues">${issues}</ul>` : ""}
      </div>
      <div class="meter ${meterCls}">
        <span class="num">${row.count}<small> / ${row.limit}</small></span>
        <span class="bar"><i style="width:${pct}%"></i></span>
        <span class="unit">${esc(unit)}</span>
      </div>
    </li>`;
  }

  function specText(field, media) {
    const T = t();
    const parts = [media.countMode === "width" ? T.specWidth(field.limit) : T.specChar(field.limit, field.soft)];
    if (field.minItems && field.maxItems) parts.push(T.specRange(field.minItems, field.maxItems));
    else if (field.maxItems) parts.push(T.specMax(field.maxItems));
    return parts.join(" · ");
  }

  let lastResults = []; // [{field, rows, notices}]

  // 固定の文言（data-i18n 属性）と、言語・テーマのボタン
  function renderChrome() {
    const T = t();
    document.documentElement.lang = T.htmlLang;
    document.documentElement.dataset.theme = theme;
    document.title = T.title;
    $$("[data-i18n]").forEach((el) => { el.textContent = T[el.dataset.i18n]; });
    $$("[data-i18n-html]").forEach((el) => { el.innerHTML = T[el.dataset.i18nHtml]; });
    $$("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", T[el.dataset.i18nAria]); });
    $$("#langSwitch [data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    $("#themeText").textContent = theme === "dark" ? T.themeDark : T.themeLight;
  }

  function renderTabs() {
    $("#mediaTabs").innerHTML = Object.entries(R.media)
      .map(
        ([key, m]) =>
          `<button type="button" class="media-tab" role="tab" data-media="${key}" aria-selected="${key === state.media}">
            <span>${esc(L(m.label))}</span><small>${esc(L(m.sub) || "")}</small>
          </button>`
      )
      .join("");
  }

  function renderFields() {
    const T = t();
    const media = R.media[state.media];
    $("#fields").innerHTML = media.fields
      .map((f) => {
        const label = L(f.label);
        return `<section class="field" data-field="${f.key}">
          <div class="field-head">
            <h2>${esc(label)}</h2>
            <span class="spec">${esc(specText(f, media))}</span>
            <span class="field-count" data-role="count"></span>
          </div>
          <div class="field-notices" data-role="notices"></div>
          <div class="field-body">
            <div class="input-col">
              <textarea data-field="${f.key}" spellcheck="false" aria-label="${esc(label)}"
                placeholder="${esc(T.placeholder)}">${esc(state.texts[f.key] || "")}</textarea>
              <div class="input-actions">
                <button type="button" class="btn small" data-action="tidy" data-field="${f.key}" title="${esc(T.tidyTitle)}">${esc(T.tidy)}</button>
                <button type="button" class="btn small ghost" data-action="clear" data-field="${f.key}">${esc(T.clear)}</button>
                <span class="input-hint">${esc(T.onePerLine)}</span>
              </div>
            </div>
            <ol class="results" data-role="results"></ol>
          </div>
        </section>`;
      })
      .join("");
    updateResults();
  }

  function updateResults() {
    const T = t();
    const mediaKey = state.media;
    const media = R.media[mediaKey];
    const totals = { error: 0, warn: 0, info: 0, ok: 0 };
    lastResults = [];

    for (const f of media.fields) {
      const sec = $(`.field[data-field="${f.key}"]`);
      if (!sec) continue;
      const res = checkField(f, mediaKey, media);
      lastResults.push({ field: f, ...res });

      res.rows.forEach((r) => totals[r.level]++);
      res.notices.forEach((n) => { if (n.level === "error") totals.error++; });

      $('[data-role="results"]', sec).innerHTML = res.rows.length
        ? res.rows.map((r, i) => rowHtml(r, i, media)).join("")
        : `<li class="empty">${esc(T.empty)}</li>`;
      $('[data-role="notices"]', sec).innerHTML = res.notices
        .map((n) => `<p class="field-notice ${n.level}">${esc(n.text)}</p>`)
        .join("");
      $('[data-role="count"]', sec).textContent = f.maxItems ? T.countMax(res.rows.length, f.maxItems) : T.count(res.rows.length);
    }

    $("#summary").innerHTML = ["error", "warn", "info", "ok"]
      .map((k) => `<span class="pill ${k}${totals[k] ? "" : " zero"}">${esc(T.levels[k])} ${totals[k]}</span>`)
      .join("");
  }

  function renderAll() {
    renderChrome();
    renderTabs();
    renderFields();
  }

  // ---------------------------------------------------------------
  // 整形
  // ---------------------------------------------------------------
  function tidy(s) {
    return s
      .split(/\r?\n/)
      .map((line) =>
        line
          .replace(/[０-９Ａ-Ｚａ-ｚ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
          .replace(/[｡-ﾟ]+/g, (m) => m.normalize("NFKC"))
          .replace(/[ 　]{2,}/g, (m) => m[0])
          .replace(/^[ 　\t]+|[ 　\t]+$/g, "")
      )
      .join("\n");
  }

  // ---------------------------------------------------------------
  // 書き出し（表示中の言語で出力）
  // ---------------------------------------------------------------
  function exportRows() {
    const T = t();
    const media = R.media[state.media];
    const body = [];
    for (const { field, rows } of lastResults) {
      rows.forEach((r, i) => {
        body.push([
          L(media.label),
          L(field.label),
          String(i + 1),
          r.text,
          String(r.count),
          String(r.limit),
          T.levels[r.level],
          r.issues.map((is) => `${is.title}${is.words.length ? `「${is.words.join("」「")}」` : ""}`).join(" / "),
        ]);
      });
    }
    return [T.exportHead, ...body];
  }

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 1800);
  }

  async function copyTsv() {
    const rows = exportRows();
    if (rows.length <= 1) return toast(t().toastNothing);
    const tsv = rows.map((r) => r.map((v) => v.replace(/[\t\r\n]+/g, " ")).join("\t")).join("\n");
    try {
      await navigator.clipboard.writeText(tsv);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = tsv;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    toast(t().toastCopied);
  }

  function downloadCsv() {
    const rows = exportRows();
    if (rows.length <= 1) return toast(t().toastNothing);
    const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ad-copy-check_${state.media}_${ymd}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---------------------------------------------------------------
  // イベント
  // ---------------------------------------------------------------
  $("#langSwitch").addEventListener("click", (e) => {
    const b = e.target.closest("[data-lang]");
    if (!b || b.dataset.lang === lang) return;
    lang = b.dataset.lang;
    store(LANG_KEY, lang);
    renderAll();
  });

  $("#themeBtn").addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    store(THEME_KEY, theme);
    renderChrome();
  });

  $("#mediaTabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-media]");
    if (!b || b.dataset.media === state.media) return;
    state.media = b.dataset.media;
    save();
    renderTabs();
    renderFields();
  });

  $("#fields").addEventListener("input", (e) => {
    if (e.target.tagName !== "TEXTAREA") return;
    state.texts[e.target.dataset.field] = e.target.value;
    save();
    updateResults();
  });

  $("#fields").addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const key = b.dataset.field;
    const ta = $(`textarea[data-field="${key}"]`);
    if (b.dataset.action === "tidy") {
      const before = ta.value;
      ta.value = tidy(before);
      toast(before === ta.value ? t().toastNoTidy : t().toastTidied);
    } else if (b.dataset.action === "clear") {
      ta.value = "";
    }
    state.texts[key] = ta.value;
    save();
    updateResults();
  });

  $("#btnSample").addEventListener("click", () => {
    const media = R.media[state.media];
    const hasText = media.fields.some((f) => (state.texts[f.key] || "").trim());
    if (hasText && !confirm(t().confirmSample)) return;
    for (const f of media.fields) {
      const s = R.samples[f.key];
      state.texts[f.key] = s ? s.join("\n") : "";
    }
    save();
    renderFields();
  });

  $("#btnCopy").addEventListener("click", copyTsv);
  $("#btnCsv").addEventListener("click", downloadCsv);

  renderAll();
})();
