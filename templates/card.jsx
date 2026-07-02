// card.jsx — the ONE responsive takumi template for all 4 image-card formats.
//
// Exports `renderCard(data, format, brand)` -> a React-element-shaped tree
// (`{ type, props: { style, children } }`) that `takumi-js/helpers/jsx`'s
// `fromJsx()` can convert directly. No JSX syntax/transpile needed: `h()`
// below is a tiny hyperscript helper so this file stays plain JS while
// still reading like a declarative element tree. The `.jsx` extension
// signals "this is the design surface," per the brief.
//
// data   = { headline, stat, statLabel, url, logo }
//          `logo` is the raw SVG file contents (Buffer | Uint8Array) —
//          render_cards.mjs reads brand.logo once and passes it in,
//          keeping this template a pure function of its inputs.
// format = "feed" | "story" | "thumb" | "banner"  (see FORMATS)
// brand  = the loaded brand.json (see scripts/lib_brand.mjs). EVERY
//          color/font/name/domain literal in this file is read from
//          brand — no hardcoded hex, font names, or brand strings.

// Exact px per the brief. Exported so render_cards.mjs is the only place
// that needs to know sizes too — both read from here.
export const FORMATS = {
  feed: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
  thumb: { width: 1280, height: 720 },
  banner: { width: 1584, height: 396 },
};

/** Tiny hyperscript helper -> the {type, props} shape fromJsx expects. */
function h(type, props, ...children) {
  const flatChildren = children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false);
  return {
    type,
    props: {
      ...props,
      children: flatChildren.length === 0 ? undefined : flatChildren.length === 1 ? flatChildren[0] : flatChildren,
    },
  };
}

function safeMargin(width, height) {
  return Math.round(Math.min(width, height) * 0.08);
}

function Logo({ src, size }) {
  return h("img", {
    src,
    style: { width: size, height: size, display: "flex" },
  });
}

function Headline({ text, fontSize, maxWidth, font, color }) {
  return h(
    "div",
    {
      style: {
        display: "flex",
        fontFamily: font.display,
        fontWeight: 700,
        fontSize,
        lineHeight: 1.08,
        color: color.text,
        maxWidth,
        letterSpacing: "-0.01em",
      },
    },
    text,
  );
}

function StatBlock({ stat, statLabel, statFontSize, labelFontSize, align = "flex-start", font, color }) {
  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", alignItems: align } },
    h(
      "div",
      {
        style: {
          display: "flex",
          fontFamily: font.display,
          fontWeight: 700,
          fontSize: statFontSize,
          lineHeight: 1,
          color: color.primary,
          letterSpacing: "-0.02em",
        },
      },
      stat,
    ),
    h(
      "div",
      {
        style: {
          display: "flex",
          fontFamily: font.body,
          fontWeight: 500,
          fontSize: labelFontSize,
          lineHeight: 1.3,
          color: color.accent,
          marginTop: Math.round(labelFontSize * 0.4),
          maxWidth: "80%",
          textAlign: align === "center" ? "center" : "left",
        },
      },
      statLabel,
    ),
  );
}

function UrlFooter({ url, fontSize, font, color }) {
  return h(
    "div",
    {
      style: {
        display: "flex",
        fontFamily: font.body,
        fontWeight: 500,
        fontSize,
        color: color.text,
        opacity: 0.6,
      },
    },
    url.replace(/^https?:\/\//, ""),
  );
}

/**
 * Portrait/landscape composition (feed, story, thumb): stacked —
 * headline top-left, stat as the large focal block in the middle/lower
 * area, logo + url bottom-left.
 */
function stackedLayout(data, width, height, sizes, font, color) {
  const margin = safeMargin(width, height);
  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        backgroundColor: color.bg,
        padding: margin,
      },
    },
    // top: headline
    h(
      Headline,
      { text: data.headline, fontSize: sizes.headline, maxWidth: `${100 - 4}%`, font, color },
    ),
    // middle: stat as hero focal element
    h(
      "div",
      { style: { display: "flex", flex: 1, alignItems: "center" } },
      h(StatBlock, {
        stat: data.stat,
        statLabel: data.statLabel,
        statFontSize: sizes.stat,
        labelFontSize: sizes.label,
        font,
        color,
      }),
    ),
    // bottom: logo (bottom-left) + url
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: Math.round(margin * 0.4) } },
      h(Logo, { src: data.logo, size: sizes.logo }),
      h(UrlFooter, { url: data.url, fontSize: sizes.url, font, color }),
    ),
  );
}

/**
 * Banner composition: wide + short (1584x396) -> single row. Logo left,
 * headline + stat share the row so nothing clips at 396px tall.
 */
function bannerLayout(data, width, height, sizes, font, color) {
  const margin = safeMargin(width, height);
  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        backgroundColor: color.bg,
        padding: margin,
      },
    },
    // left: logo + headline stacked tight
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: "56%" } },
      h(Logo, { src: data.logo, size: sizes.logo }),
      h(Headline, {
        text: data.headline,
        fontSize: sizes.headline,
        maxWidth: "100%",
        font,
        color,
      }),
    ),
    // right: stat as the focal element, right-aligned
    h(StatBlock, {
      stat: data.stat,
      statLabel: data.statLabel,
      statFontSize: sizes.stat,
      labelFontSize: sizes.label,
      align: "flex-start",
      font,
      color,
    }),
  );
}

// Per-format type scale. Sizes are tuned per aspect ratio so the stat
// stays the dominant element without clipping or looking stretched.
const SIZE_SCALE = {
  feed: { headline: 56, stat: 168, label: 32, url: 26, logo: 56 },
  story: { headline: 64, stat: 200, label: 36, url: 28, logo: 64 },
  thumb: { headline: 52, stat: 140, label: 30, url: 24, logo: 48 },
  banner: { headline: 34, stat: 120, label: 22, url: 0, logo: 40 },
};

/**
 * The one template entry point: (data, format, brand) => element tree.
 * Branches ONLY where composition must differ (banner = single row;
 * feed/story/thumb = stacked). Everything else (colors, fonts, margin
 * math) is shared and pulled from `brand` — no hardcoded design tokens.
 */
export function renderCard(data, format, brand) {
  const { width, height } = FORMATS[format];
  const sizes = SIZE_SCALE[format];
  if (!width || !height) throw new Error(`unknown format: ${format}`);
  if (!brand || !brand.colors || !brand.fonts) {
    throw new Error("renderCard(data, format, brand) requires a brand object with colors + fonts (see brand/brand.json)");
  }

  const font = { display: brand.fonts.display, body: brand.fonts.body };
  const color = {
    bg: brand.colors.bg,
    text: brand.colors.text,
    primary: brand.colors.primary,
    accent: brand.colors.accent,
  };

  const body =
    format === "banner"
      ? bannerLayout(data, width, height, sizes, font, color)
      : stackedLayout(data, width, height, sizes, font, color);

  return body;
}
