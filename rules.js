// =============================================================
// 媒体ごとの入稿ルールと、注意が必要な表現の定義
// -------------------------------------------------------------
// ・媒体の規定は変わることがあります。最新の媒体ヘルプを確認して、
//   ここの数値や語句を更新してください。
// ・表示名や説明は { en: 英語, ja: 日本語 } で書きます。
// ・countMode
//     "width" … 全角=2 / 半角=1 で数える（Google・Yahoo!）
//     "char"  … 全角も半角も1文字で数える（Meta・LINE）
// ・field.soft = true の項目は「推奨文字数」扱いで、超えても警告止まり。
// ・checks の値は "error" | "warn" | "info" | null（null はチェックしない）
// =============================================================
window.AD_RULES = {
  media: {
    google_search: {
      label: { en: "Google Search", ja: "Google 検索" },
      sub: { en: "Responsive search ads", ja: "レスポンシブ検索広告" },
      countMode: "width",
      fields: [
        { key: "headline", label: { en: "Headlines", ja: "広告見出し" }, limit: 30, minItems: 3, maxItems: 15 },
        { key: "description", label: { en: "Descriptions", ja: "説明文" }, limit: 90, minItems: 2, maxItems: 4 },
        { key: "path", label: { en: "Display path", ja: "表示URLのパス" }, limit: 15, maxItems: 2 },
      ],
      checks: {
        exclamation: { headline: 0, description: 1 },
        emoji: "error",
        dependentChars: "warn",
        halfKana: "warn",
        decorativeSymbols: "error",
        repeatedSymbols: "warn",
        phone: "warn",
        allCaps: "info",
        fullwidthAlnum: true,
      },
    },

    yahoo_search: {
      label: { en: "Yahoo! Search", ja: "Yahoo! 検索" },
      sub: { en: "Responsive search ads", ja: "レスポンシブ検索広告" },
      countMode: "width",
      fields: [
        { key: "headline", label: { en: "Titles", ja: "タイトル" }, limit: 30, minItems: 3, maxItems: 15 },
        { key: "description", label: { en: "Descriptions", ja: "説明文" }, limit: 90, minItems: 2, maxItems: 4 },
        { key: "path", label: { en: "Display URL directory", ja: "表示URLのディレクトリ" }, limit: 15, maxItems: 2 },
      ],
      checks: {
        exclamation: null,
        emoji: "error",
        dependentChars: "error",
        halfKana: "error",
        decorativeSymbols: "error",
        repeatedSymbols: "warn",
        phone: "warn",
        allCaps: "info",
        fullwidthAlnum: true,
      },
    },

    google_display: {
      label: { en: "Google Display", ja: "Google ディスプレイ" },
      sub: { en: "Responsive display ads", ja: "レスポンシブ ディスプレイ広告" },
      countMode: "width",
      fields: [
        { key: "short_headline", label: { en: "Short headlines", ja: "広告見出し（短）" }, limit: 30, minItems: 1, maxItems: 5 },
        { key: "long_headline", label: { en: "Long headline", ja: "長い広告見出し" }, limit: 90, minItems: 1, maxItems: 1 },
        { key: "description", label: { en: "Descriptions", ja: "説明文" }, limit: 90, minItems: 1, maxItems: 5 },
      ],
      checks: {
        exclamation: null,
        emoji: "error",
        dependentChars: "warn",
        halfKana: "warn",
        decorativeSymbols: "error",
        repeatedSymbols: "warn",
        phone: "warn",
        allCaps: "info",
        fullwidthAlnum: true,
      },
    },

    meta: {
      label: { en: "Meta", ja: "Meta" },
      sub: { en: "Facebook / Instagram", ja: "Facebook / Instagram" },
      countMode: "char",
      fields: [
        { key: "primary", label: { en: "Primary text", ja: "メインテキスト" }, limit: 125, soft: true },
        { key: "headline", label: { en: "Headline", ja: "見出し" }, limit: 40, soft: true },
        { key: "description", label: { en: "Description", ja: "説明" }, limit: 30, soft: true },
      ],
      checks: {
        exclamation: null,
        emoji: null,
        dependentChars: "info",
        halfKana: "info",
        decorativeSymbols: null,
        repeatedSymbols: "info",
        phone: null,
        allCaps: null,
        fullwidthAlnum: false,
      },
    },

    line: {
      label: { en: "LINE Ads", ja: "LINE広告" },
      sub: { en: "Image / video", ja: "静止画・動画" },
      countMode: "char",
      fields: [
        { key: "headline", label: { en: "Title", ja: "タイトル" }, limit: 20 },
        { key: "description", label: { en: "Description", ja: "ディスクリプション" }, limit: 75 },
      ],
      checks: {
        exclamation: null,
        emoji: "warn",
        dependentChars: "warn",
        halfKana: "warn",
        decorativeSymbols: "info",
        repeatedSymbols: "warn",
        phone: "info",
        allCaps: "info",
        fullwidthAlnum: false,
      },
    },
  },

  // 注意が必要な表現。全角・半角、大文字・小文字の違いは無視して照合します。
  // media を指定すると、その媒体でだけチェックします。
  expressions: [
    {
      category: { en: "Superlatives / No.1 claims", ja: "最上級・No.1表示" },
      level: "warn",
      note: {
        en: "Needs objective evidence and a footnote (who ran the survey, when, and on whom). Without it, this may count as a misleading claim under Japan's Premiums and Representations Act.",
        ja: "客観的な調査の根拠と注釈（調査機関・時期・対象）が必要です。根拠がないと景品表示法の優良誤認にあたるおそれがあります。",
      },
      words: [
        "No.1", "No1", "ナンバーワン", "ナンバー1", "日本一", "世界一", "業界一", "地域一",
        "最安", "最安値", "最高", "最高級", "最高峰", "最上級", "最大級", "最強",
        "業界初", "日本初", "世界初", "唯一", "一番", "トップクラス", "圧倒的",
      ],
    },
    {
      category: { en: "Absolute claims / guarantees", ja: "断定・保証" },
      level: "warn",
      note: {
        en: "Reads as a guarantee of results. Check whether you can state the evidence or conditions.",
        ja: "効果や結果を保証していると受け取られる表現です。根拠や条件を書けるか確認してください。",
      },
      words: ["絶対", "必ず", "100%", "確実", "完全", "永久", "永遠", "保証", "間違いなし", "誰でも", "全員"],
    },
    {
      category: { en: "Health / efficacy claims (PMD Act)", ja: "効能効果（薬機法）" },
      level: "warn",
      note: {
        en: "May not be allowed for cosmetics, health foods, etc. Check the product category (drug / quasi-drug / cosmetic / food).",
        ja: "化粧品・健康食品などでは使えない場合があります。商材の区分（医薬品／医薬部外品／化粧品／食品）を確認してください。",
      },
      words: [
        "治る", "治す", "治療", "完治", "改善", "予防", "痩せる", "やせる", "脂肪燃焼", "燃焼",
        "若返", "アンチエイジング", "シミが消", "シワが消", "シミ消", "シワ消", "美白", "育毛", "発毛",
        "免疫", "デトックス", "副作用", "医師推奨", "医師も推薦", "効く", "効果抜群",
      ],
    },
    {
      category: { en: "Price / time-limited offers", ja: "価格・期間の訴求" },
      level: "info",
      note: {
        en: "Make sure the period, conditions and eligibility are stated in the ad or on the landing page (to avoid misleading offers).",
        ja: "期間・条件・対象をLPや広告内で明記できるか確認してください（有利誤認の防止）。",
      },
      words: ["今だけ", "期間限定", "本日限り", "今日だけ", "先着", "激安", "半額", "0円", "無料", "タダ"],
    },
    {
      category: { en: "Click bait", ja: "クリック誘導" },
      level: "error",
      media: ["google_search", "google_display", "yahoo_search"],
      note: {
        en: "Phrases that just ask for a click aren't allowed. Describe the action instead (e.g. \"See details\").",
        ja: "クリックそのものを促す表現は使えません。「詳しくはこちら」など行動の中身を書いてください。",
      },
      words: ["ここをクリック", "クリックして", "今すぐクリック", "クリックはこちら", "click here"],
    },
  ],

  // 「サンプルを入れる」で入る例文（架空の商品）
  samples: {
    headline: [
      "【公式】うるおいラボ 美容液",
      "シミが消える新習慣！",
      "満足度No.1の保湿美容液",
      "今だけ初回半額キャンペーン実施中です",
      "ＳＡＬＥ開催中",
      "ｷｬﾝﾍﾟｰﾝ実施中",
      "敏感肌にもやさしい処方",
    ],
    description: [
      "毎日の保湿ケアで、うるおいのある肌へ。今なら送料無料でお試しいただけます!!",
      "ここをクリックして詳細をチェック。ご相談は03-1234-5678まで。",
      "皮膚科医と共同開発。べたつかないのに、しっかり保湿。",
    ],
    path: ["美容液", "初回限定キャンペーン"],
    short_headline: ["【公式】うるおいラボ", "絶対にうるおう美容液★"],
    long_headline: ["皮膚科医と共同開発した保湿美容液。今なら初回半額でお試しいただけます"],
    primary: [
      "乾燥が気になる季節に。皮膚科医と共同開発した保湿美容液で、朝までうるおいが続く肌へ。今なら初回半額、送料無料でお試しいただけます。定期縛りなし、いつでも解約OKです。",
    ],
  },
};
