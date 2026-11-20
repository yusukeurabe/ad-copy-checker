// =============================================================
// 媒体ごとの入稿ルールと、注意が必要な表現の定義
// -------------------------------------------------------------
// ・媒体の規定は変わることがあります。最新の媒体ヘルプを確認して、
//   ここの数値や語句を更新してください。
// ・表示名や説明は { en: 英語, ja: 日本語 } で書きます。
// ・countMode
//     "width" … 全角=2 / 半角=1 で数える（Google・Yahoo! 検索・Microsoft）
//     "char"  … 全角も半角も1文字で数える（YDA・Meta）
// ・field.soft = true の項目は「推奨文字数」扱いで、超えても警告止まり。
// ・field.minLength … 1行あたりの推奨最小文字数。下回ると警告。
// ・field.needShort … { limit, level }。limit 以下の行が1つもないと指摘する
//   （例：P-MAX の「15文字以下の広告見出しを1つ以上」）。
// ・checks の値は "error" | "warn" | "info" | null（null はチェックしない）
//   exclamation / brackets は { 項目キー: 上限数 } で書き、超えたらエラー。
//   emoji も { 項目キー: 上限数 } で書けます（YDA はタイトルのみ2つまで）。
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

    pmax: {
      label: { en: "Performance Max", ja: "P-MAX" },
      sub: { en: "Asset group text", ja: "アセットグループのテキスト" },
      countMode: "width",
      fields: [
        {
          key: "headline", label: { en: "Headlines", ja: "広告見出し" }, limit: 30, minItems: 3, maxItems: 15,
          needShort: { limit: 15, level: "error" },
        },
        { key: "long_headline", label: { en: "Long headlines", ja: "長い広告見出し" }, limit: 90, minItems: 1, maxItems: 5, minLength: 30 },
        {
          key: "description", label: { en: "Descriptions", ja: "説明文" }, limit: 90, minItems: 2, maxItems: 5,
          // ヘルプには記載がなく、API のエラー（SHORT_DESCRIPTION_REQUIRED）にだけある条件なので警告
          needShort: { limit: 60, level: "warn" },
        },
        { key: "business_name", label: { en: "Business name", ja: "ビジネスの名前" }, limit: 25, minItems: 1, maxItems: 1 },
      ],
      checks: {
        exclamation: { headline: 0, long_headline: 0, description: 1, business_name: 0 },
        emoji: "error",
        dependentChars: "warn",
        halfKana: "error",
        decorativeSymbols: "error",
        repeatedSymbols: "warn",
        phone: "warn",
        allCaps: "info",
        fullwidthAlnum: true,
      },
    },

    demand_gen: {
      label: { en: "Demand Gen", ja: "デマンド ジェネレーション" },
      sub: { en: "Image / video ads", ja: "画像・動画広告" },
      countMode: "width",
      fields: [
        {
          key: "headline", label: { en: "Headlines", ja: "広告見出し" }, limit: 40, minItems: 1, maxItems: 5,
          // 30文字以下が1つもないと広告の有効性が「未完了」になり、ディスプレイ ネットワークに配信されない
          needShort: { limit: 30, level: "error" },
        },
        { key: "long_headline", label: { en: "Long headlines (video ads)", ja: "長い広告見出し（動画広告）" }, limit: 90, maxItems: 5 },
        { key: "description", label: { en: "Descriptions", ja: "説明文" }, limit: 90, minItems: 1, maxItems: 5 },
        { key: "business_name", label: { en: "Business name", ja: "ビジネスの名前" }, limit: 25, minItems: 1, maxItems: 1 },
      ],
      checks: {
        exclamation: { headline: 0, long_headline: 0, description: 1, business_name: 0 },
        emoji: "error",
        dependentChars: "warn",
        halfKana: "error",
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
        // 「」【】などは項目ごとに1組まで、対になっていないとエラー（丸括弧は対象外）
        brackets: { headline: 1, description: 1 },
        emoji: "error",
        dependentChars: "error",
        halfKana: "error",
        decorativeSymbols: "error",
        // 同じ種類の記号の連続は入稿不可
        repeatedSymbols: "error",
        phone: "warn",
        allCaps: "info",
        fullwidthAlnum: true,
      },
    },

    yda: {
      label: { en: "Yahoo! Display (YDA)", ja: "YDA" },
      sub: { en: "Responsive ads (assets)", ja: "レスポンシブ広告（アセット）" },
      // ヘルプは「20文字以内」とだけ書いており、検索広告のような全角=2の記載がないため1文字ずつ数える
      countMode: "char",
      fields: [
        { key: "headline", label: { en: "Titles", ja: "タイトル" }, limit: 20, minItems: 1, maxItems: 5 },
        { key: "description", label: { en: "Descriptions", ja: "説明文" }, limit: 90, minItems: 1, maxItems: 5 },
        { key: "business_name", label: { en: "Advertiser name", ja: "主体者表記" }, limit: 20, minItems: 1, maxItems: 1 },
      ],
      checks: {
        exclamation: null,
        // アセット入稿タイプはタイトル・説明文それぞれ1組まで
        brackets: { headline: 1, description: 1 },
        // 絵文字はタイトルのみ2つまで
        emoji: { headline: 2, description: 0, business_name: 0 },
        dependentChars: "error",
        halfKana: "error",
        // ★♪→■ などはディスプレイ広告では使える記号
        decorativeSymbols: null,
        repeatedSymbols: "error",
        phone: "warn",
        allCaps: "info",
        fullwidthAlnum: false,
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

    microsoft: {
      label: { en: "Microsoft Ads", ja: "Microsoft 広告" },
      sub: { en: "Responsive search ads", ja: "レスポンシブ検索広告" },
      countMode: "width",
      fields: [
        // API の下限は3つ。手動入稿のヘルプでは5つ以上とされている
        { key: "headline", label: { en: "Headlines", ja: "広告見出し" }, limit: 30, minItems: 3, maxItems: 15 },
        { key: "description", label: { en: "Descriptions", ja: "説明文" }, limit: 90, minItems: 2, maxItems: 4 },
        { key: "path", label: { en: "Display path", ja: "表示URLのパス" }, limit: 15, maxItems: 2 },
      ],
      checks: {
        // 「！」「？」は1文につき1つまで（見出しの禁止はなし）。連続は repeatedSymbols で拾う
        exclamation: null,
        emoji: "error",
        dependentChars: "warn",
        // 日本向け広告では半角カナ不可
        halfKana: "error",
        // 装飾記号・矢印・ブロック要素などは見出し・説明文で使えない
        decorativeSymbols: "error",
        // 英数字以外の記号の連続は不可
        repeatedSymbols: "error",
        // 日本は電話番号の禁止国に含まれていない（米・加・英・香港・台湾のみ）
        phone: "info",
        // 過度な大文字は不可
        allCaps: "warn",
        fullwidthAlnum: true,
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
      media: ["google_search", "pmax", "demand_gen", "yahoo_search", "yda", "microsoft"],
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
    business_name: ["うるおいラボ"],
    long_headline: ["皮膚科医と共同開発した保湿美容液。今なら初回半額でお試しいただけます"],
    primary: [
      "乾燥が気になる季節に。皮膚科医と共同開発した保湿美容液で、朝までうるおいが続く肌へ。今なら初回半額、送料無料でお試しいただけます。定期縛りなし、いつでも解約OKです。",
    ],
  },
};
