"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// ============================================================
// ARC COMMUNITY BANNER GENERATOR
// Native SVG — 1500 × 500
// ============================================================

const BANNER_W = 1500;
const BANNER_H = 500;

// ------------------------------------------------------------
// Customizable areas
// ------------------------------------------------------------

const AVATAR = {
  cx: 165,
  cy: 145,
  r: 108,
};

const FLAG = {
  x: 1300,
  y: 78,
  w: 125,
  h: 82,
};

const NAME = {
  x: 165,
  y: 285,
};

const CHAPTER = {
  x: 165,
  y: 330,
};

// ============================================================
// TYPES
// ============================================================

type Pan = {
  x: number;
  y: number;
};

type BannerOptions = {
  avatar: string | null;
  flag: string | null;

  name: string;
  chapter: string;

  avatarScale: number;
  avatarPan: Pan;

  flagScale: number;
  flagPan: Pan;

  nameFont: string;
  nameSize: number;
  namePan: Pan;

  chapterFont: string;
  chapterSize: number;
  chapterPan: Pan;
};

// ============================================================
// HELPERS
// ============================================================

function escapeXML(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function loadFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Unable to read file"));
      }
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================================
// ARC LOGO
// Native SVG approximation of the supplied Arc emblem.
// ============================================================

function arcLogoSVG(
  cx: number,
  cy: number,
  size: number
) {
  const r = size / 2;

  return `
    <g transform="translate(${cx - r}, ${cy - r})">

      <!-- Outer dark circle -->
      <circle
        cx="${r}"
        cy="${r}"
        r="${r}"
        fill="#071126"
      />

      <!-- Outer metallic ring -->
      <circle
        cx="${r}"
        cy="${r}"
        r="${r - 7}"
        fill="none"
        stroke="#d9dee7"
        stroke-width="7"
        opacity="0.95"
      />

      <!-- Inner dark surface -->
      <circle
        cx="${r}"
        cy="${r}"
        r="${r - 19}"
        fill="#17223d"
      />

      <!-- Subtle upper highlight -->
      <path
        d="
          M ${r - 77} ${r - 75}
          C ${r - 20} ${r - 112},
            ${r + 63} ${r - 85},
            ${r + 82} ${r - 35}
        "
        fill="none"
        stroke="#68738a"
        stroke-width="8"
        stroke-linecap="round"
        opacity="0.65"
      />

      <!-- Arc A -->
      <path
        d="
          M ${r - 66} ${r + 58}
          L ${r - 66} ${r + 16}
          C ${r - 66} ${r - 36},
            ${r - 36} ${r - 67},
            ${r} ${r - 67}
          C ${r + 42} ${r - 67},
            ${r + 68} ${r - 34},
            ${r + 68} ${r + 17}
          L ${r + 68} ${r + 58}
          L ${r + 42} ${r + 45}
          L ${r + 42} ${r + 17}
          C ${r + 42} ${r - 12},
            ${r + 26} ${r - 28},
            ${r} ${r - 28}
          C ${r - 24} ${r - 28},
            ${r - 40} ${r - 11},
            ${r - 40} ${r + 17}
          L ${r - 40} ${r + 58}
          Z
        "
        fill="#f4f5f7"
      />

      <!-- Arc horizontal cut -->
      <path
        d="
          M ${r - 15} ${r + 12}
          L ${r + 42} ${r + 12}
          L ${r + 42} ${r + 39}
          L ${r - 15} ${r + 39}
          Z
        "
        fill="#17223d"
      />

    </g>
  `;
}

// ============================================================
// GLOBAL MAP
// ============================================================

function worldMapSVG() {
  return `
    <g
      opacity="0.92"
      fill="#dbe5f1"
    >

      <!-- North America -->
      <path d="
        M 425 335
        L 405 319
        L 382 315
        L 367 299
        L 380 282
        L 404 274
        L 429 282
        L 447 300
        L 438 317
        Z
      "/>

      <!-- South America -->
      <path d="
        M 470 350
        L 489 366
        L 484 393
        L 469 419
        L 457 403
        L 459 377
        Z
      "/>

      <!-- Europe -->
      <path d="
        M 720 285
        L 740 273
        L 763 276
        L 774 288
        L 759 299
        L 735 300
        Z
      "/>

      <!-- Africa -->
      <path d="
        M 735 314
        L 766 311
        L 783 330
        L 777 361
        L 758 394
        L 739 369
        L 729 342
        Z
      "/>

      <!-- Asia -->
      <path d="
        M 775 273
        L 822 258
        L 875 267
        L 918 285
        L 906 307
        L 865 311
        L 835 300
        L 805 312
        L 781 300
        Z
      "/>

      <!-- India -->
      <path d="
        M 834 309
        L 851 317
        L 842 343
        L 829 327
        Z
      "/>

      <!-- Australia -->
      <path d="
        M 910 378
        L 944 374
        L 965 389
        L 951 405
        L 920 404
        L 901 392
        Z
      "/>

    </g>
  `;
}

// ============================================================
// LOCATION PIN
// ============================================================

function pinSVG(
  x: number,
  y: number,
  color: string
) {
  return `
    <g transform="translate(${x}, ${y})">

      <path
        d="
          M 0 -17
          C -10 -17 -17 -9 -17 1
          C -17 13 0 27 0 27
          C 0 27 17 13 17 1
          C 17 -9 10 -17 0 -17
          Z
        "
        fill="${color}"
        stroke="#ffffff"
        stroke-width="4"
      />

      <circle
        cx="0"
        cy="0"
        r="5"
        fill="#ffffff"
      />

    </g>
  `;
}

// ============================================================
// TOKEN BADGE
// ============================================================

function tokenSVG(
  x: number,
  y: number,
  label: string,
  color: string,
  symbol: string
) {
  return `
    <g transform="translate(${x}, ${y})">

      <circle
        cx="0"
        cy="0"
        r="27"
        fill="${color}"
        stroke="#ffffff"
        stroke-width="4"
      />

      <text
        x="0"
        y="-1"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="Arial, sans-serif"
        font-size="17"
        font-weight="800"
        fill="#ffffff"
      >
        ${symbol}
      </text>

      <rect
        x="-37"
        y="33"
        width="74"
        height="24"
        rx="12"
        fill="#ffffff"
        opacity="0.94"
      />

      <text
        x="0"
        y="49"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="10"
        font-weight="800"
        fill="#0b1630"
      >
        ${label}
      </text>

    </g>
  `;
}

// ============================================================
// PERSON ILLUSTRATION
// ============================================================

function personSVG(
  x: number,
  y: number,
  scale = 1,
  skin = "#8d573f",
  shirt = "#1e477a",
  pants = "#23324f"
) {
  return `
    <g transform="translate(${x}, ${y}) scale(${scale})">

      <!-- head -->
      <circle
        cx="0"
        cy="-52"
        r="16"
        fill="${skin}"
      />

      <!-- hair -->
      <path
        d="
          M -16 -52
          C -14 -72 14 -75 18 -53
          C 9 -62 -2 -65 -16 -52
          Z
        "
        fill="#182033"
      />

      <!-- body -->
      <path
        d="
          M -22 -34
          C -13 -42 13 -42 22 -34
          L 28 16
          L -28 16
          Z
        "
        fill="${shirt}"
      />

      <!-- arm -->
      <path
        d="
          M -18 -26
          L -45 1
          L -39 7
          L -10 -12
        "
        fill="${skin}"
      />

      <!-- other arm -->
      <path
        d="
          M 18 -26
          L 42 -4
          L 37 3
          L 8 -13
        "
        fill="${skin}"
      />

      <!-- trousers -->
      <path
        d="
          M -27 14
          L -3 14
          L -8 64
          L -27 64
          Z
        "
        fill="${pants}"
      />

      <path
        d="
          M 3 14
          L 27 14
          L 31 64
          L 11 64
          Z
        "
        fill="${pants}"
      />

      <!-- shoes -->
      <path
        d="
          M -29 62
          L -5 62
          L -4 70
          L -32 70
          Z
        "
        fill="#101828"
      />

      <path
        d="
          M 9 62
          L 32 62
          L 37 70
          L 8 70
          Z
        "
        fill="#101828"
      />

    </g>
  `;
}

// ============================================================
// ARCH
// ============================================================

function archSVG(
  x: number,
  y: number,
  width: number,
  height: number,
  color: string
) {
  return `
    <g transform="translate(${x}, ${y})">

      <path
        d="
          M 0 ${height}
          L 0 ${height * 0.42}
          C 0 ${height * 0.16},
            ${width * 0.20} 0,
            ${width * 0.5} 0
          C ${width * 0.80} 0,
            ${width} ${height * 0.16},
            ${width} ${height * 0.42}
          L ${width} ${height}
          L ${width * 0.76} ${height}
          L ${width * 0.76} ${height * 0.45}
          C ${width * 0.76} ${height * 0.27},
            ${width * 0.63} ${height * 0.18},
            ${width * 0.5} ${height * 0.18}
          C ${width * 0.37} ${height * 0.18},
            ${width * 0.24} ${height * 0.27},
            ${width * 0.24} ${height * 0.45}
          L ${width * 0.24} ${height}
          Z
        "
        fill="${color}"
      />

    </g>
  `;
}

// ============================================================
// COMPLETE SVG GENERATOR
// ============================================================

function createBannerSVG(options: BannerOptions) {
  const {
    avatar,
    flag,
    name,
    chapter,
    avatarScale,
    avatarPan,
    flagScale,
    flagPan,
    nameFont,
    nameSize,
    namePan,
    chapterFont,
    chapterSize,
    chapterPan,
  } = options;

  // ----------------------------------------------------------
  // Avatar
  // ----------------------------------------------------------

  const avatarSVG = avatar
    ? `
      <defs>
        <clipPath id="avatarClip">
          <circle
            cx="${AVATAR.cx}"
            cy="${AVATAR.cy}"
            r="${AVATAR.r}"
          />
        </clipPath>
      </defs>

      <image
        href="${avatar}"
        x="${AVATAR.cx - AVATAR.r}"
        y="${AVATAR.cy - AVATAR.r}"
        width="${AVATAR.r * 2}"
        height="${AVATAR.r * 2}"
        preserveAspectRatio="xMidYMid slice"
        transform="
          translate(${avatarPan.x} ${avatarPan.y})
          scale(${avatarScale})
        "
        clip-path="url(#avatarClip)"
      />
    `
    : `
      <!-- Empty avatar area -->
      <circle
        cx="${AVATAR.cx}"
        cy="${AVATAR.cy}"
        r="${AVATAR.r}"
        fill="#ffffff"
        stroke="#d8cfc4"
        stroke-width="5"
      />

      <circle
        cx="${AVATAR.cx}"
        cy="${AVATAR.cy}"
        r="${AVATAR.r - 15}"
        fill="none"
        stroke="#ebe3db"
        stroke-width="2"
        stroke-dasharray="8 8"
      />

      <!-- person icon -->
      <circle
        cx="${AVATAR.cx}"
        cy="${AVATAR.cy - 17}"
        r="23"
        fill="#d7d1cb"
      />

      <path
        d="
          M ${AVATAR.cx - 43} ${AVATAR.cy + 50}
          C ${AVATAR.cx - 43} ${AVATAR.cy + 8},
            ${AVATAR.cx + 43} ${AVATAR.cy + 8},
            ${AVATAR.cx + 43} ${AVATAR.cy + 50}
          Z
        "
        fill="#d7d1cb"
      />
    `;

  // ----------------------------------------------------------
  // Flag
  // ----------------------------------------------------------

  const flagSVG = flag
    ? `
      <defs>
        <clipPath id="flagClip">
          <rect
            x="${FLAG.x}"
            y="${FLAG.y}"
            width="${FLAG.w}"
            height="${FLAG.h}"
            rx="14"
          />
        </clipPath>
      </defs>

      <image
        href="${flag}"
        x="${FLAG.x}"
        y="${FLAG.y}"
        width="${FLAG.w}"
        height="${FLAG.h}"
        preserveAspectRatio="xMidYMid slice"
        transform="
          translate(${flagPan.x} ${flagPan.y})
          scale(${flagScale})
        "
        clip-path="url(#flagClip)"
      />
    `
    : `
      <!-- Empty flag area -->
      <rect
        x="${FLAG.x}"
        y="${FLAG.y}"
        width="${FLAG.w}"
        height="${FLAG.h}"
        rx="14"
        fill="#ffffff"
        stroke="#d8cfc4"
        stroke-width="4"
      />

      <rect
        x="${FLAG.x + 12}"
        y="${FLAG.y + 12}"
        width="${FLAG.w - 24}"
        height="${FLAG.h - 24}"
        rx="8"
        fill="none"
        stroke="#ebe3db"
        stroke-width="2"
        stroke-dasharray="7 7"
      />

      <!-- Flag icon -->
      <line
        x1="${FLAG.x + 35}"
        y1="${FLAG.y + 29}"
        x2="${FLAG.x + 35}"
        y2="${FLAG.y + 125}"
        stroke="#b9b2aa"
        stroke-width="5"
        transform="scale(1, .65)"
        transform-origin="${FLAG.x + 35}px ${FLAG.y}px"
      />

      <path
        d="
          M ${FLAG.x + 37} ${FLAG.y + 28}
          C ${FLAG.x + 65} ${FLAG.y + 17},
            ${FLAG.x + 83} ${FLAG.y + 40},
            ${FLAG.x + 108} ${FLAG.y + 29}
          L ${FLAG.x + 108} ${FLAG.y + 62}
          C ${FLAG.x + 83} ${FLAG.y + 73},
            ${FLAG.x + 65} ${FLAG.y + 50},
            ${FLAG.x + 37} ${FLAG.y + 61}
          Z
        "
        fill="#d7d1cb"
      />
    `;

  // ----------------------------------------------------------
  // Text
  // ----------------------------------------------------------

  const nameSVG = name.trim()
    ? `
      <text
        x="${NAME.x + namePan.x}"
        y="${NAME.y + namePan.y}"
        font-family="${escapeXML(nameFont)}"
        font-size="${nameSize}"
        font-weight="700"
        fill="#0b1630"
        dominant-baseline="middle"
      >
        ${escapeXML(name.trim())}
      </text>
    `
    : "";

  const chapterSVG = chapter.trim()
    ? `
      <text
        x="${CHAPTER.x + chapterPan.x}"
        y="${CHAPTER.y + chapterPan.y}"
        font-family="${escapeXML(chapterFont)}"
        font-size="${chapterSize}"
        font-weight="500"
        fill="#4b5870"
        dominant-baseline="middle"
      >
        ${escapeXML(chapter.trim())}
      </text>
    `
    : "";

  // ==========================================================
  // SVG
  // ==========================================================

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${BANNER_W}"
  height="${BANNER_H}"
  viewBox="0 0 ${BANNER_W} ${BANNER_H}"
>

  <defs>

    <!-- Background -->
    <linearGradient
      id="backgroundGradient"
      x1="0"
      y1="0"
      x2="1"
      y2="1"
    >
      <stop offset="0%" stop-color="#fbf3ec"/>
      <stop offset="55%" stop-color="#f7eee7"/>
      <stop offset="100%" stop-color="#efe7de"/>
    </linearGradient>

    <!-- Globe gradient -->
    <linearGradient
      id="globeGradient"
      x1="0"
      y1="0"
      x2="1"
      y2="1"
    >
      <stop offset="0%" stop-color="#263d68"/>
      <stop offset="100%" stop-color="#071a3b"/>
    </linearGradient>

    <!-- Building gradients -->
    <linearGradient
      id="blueBuilding"
      x1="0"
      y1="0"
      x2="0"
      y2="1"
    >
      <stop offset="0%" stop-color="#7e9fc7"/>
      <stop offset="100%" stop-color="#3c5e91"/>
    </linearGradient>

    <linearGradient
      id="greenBuilding"
      x1="0"
      y1="0"
      x2="0"
      y2="1"
    >
      <stop offset="0%" stop-color="#73a997"/>
      <stop offset="100%" stop-color="#326b5d"/>
    </linearGradient>

    <!-- Soft shadow -->
    <filter
      id="shadow"
      x="-30%"
      y="-30%"
      width="160%"
      height="160%"
    >
      <feDropShadow
        dx="0"
        dy="10"
        stdDeviation="12"
        flood-color="#17233e"
        flood-opacity="0.14"
      />
    </filter>

    <!-- Globe clipping -->
    <clipPath id="globeClip">
      <ellipse
        cx="750"
        cy="478"
        rx="370"
        ry="150"
      />
    </clipPath>

  </defs>

  <!-- ====================================================== -->
  <!-- BACKGROUND -->
  <!-- ====================================================== -->

  <rect
    width="${BANNER_W}"
    height="${BANNER_H}"
    fill="url(#backgroundGradient)"
  />

  <!-- subtle top curves -->
  <path
    d="
      M 0 80
      C 300 0 520 70 750 40
      C 1010 5 1220 70 1500 10
    "
    fill="none"
    stroke="#ffffff"
    stroke-width="3"
    opacity="0.7"
  />

  <path
    d="
      M 0 105
      C 320 25 530 105 750 65
      C 1020 25 1230 90 1500 35
    "
    fill="none"
    stroke="#ffffff"
    stroke-width="2"
    opacity="0.45"
  />

  <!-- ====================================================== -->
  <!-- GLOBAL ARCHITECTURE -->
  <!-- ====================================================== -->

  ${archSVG(300, 255, 95, 180, "#314e78")}
  ${archSVG(1180, 270, 100, 165, "#3e695f")}

  <!-- Paris-style tower -->
  <g transform="translate(420 100)">
    <path
      d="
        M 28 220
        L 50 50
        L 72 220
        Z
      "
      fill="#9aa8ba"
    />

    <path
      d="
        M 50 0
        L 62 50
        L 38 50
        Z
      "
      fill="#687b98"
    />

    <line
      x1="28"
      y1="115"
      x2="72"
      y2="115"
      stroke="#71829a"
      stroke-width="5"
    />

    <line
      x1="33"
      y1="150"
      x2="67"
      y2="150"
      stroke="#71829a"
      stroke-width="5"
    />

    <line
      x1="38"
      y1="180"
      x2="62"
      y2="180"
      stroke="#71829a"
      stroke-width="5"
    />
  </g>

  <!-- Asian pagoda -->
  <g transform="translate(520 200)">
    <path
      d="M 0 80 L 60 80 L 48 65 L 12 65 Z"
      fill="#d5a889"
    />

    <path
      d="M 8 65 L 52 65 L 45 50 L 15 50 Z"
      fill="#bc8065"
    />

    <path
      d="M 16 50 L 44 50 L 38 35 L 22 35 Z"
      fill="#a76655"
    />

    <rect
      x="27"
      y="15"
      width="7"
      height="20"
      fill="#6f5147"
    />
  </g>

  <!-- modern towers -->
  <g opacity="0.85">

    <rect
      x="1060"
      y="130"
      width="72"
      height="180"
      rx="7"
      fill="url(#blueBuilding)"
    />

    <rect
      x="1145"
      y="90"
      width="48"
      height="220"
      rx="6"
      fill="#87a9cb"
    />

    <rect
      x="1210"
      y="155"
      width="70"
      height="155"
      rx="8"
      fill="url(#greenBuilding)"
    />

    <rect
      x="1295"
      y="120"
      width="54"
      height="190"
      rx="8"
      fill="#9bb1c7"
    />

  </g>

  <!-- ====================================================== -->
  <!-- WORLD GLOBE -->
  <!-- ====================================================== -->

  <ellipse
    cx="750"
    cy="478"
    rx="370"
    ry="150"
    fill="url(#globeGradient)"
    filter="url(#shadow)"
  />

  <g clip-path="url(#globeClip)">

    ${worldMapSVG()}

    <!-- latitude lines -->
    <ellipse
      cx="750"
      cy="478"
      rx="350"
      ry="95"
      fill="none"
      stroke="#91b5d8"
      stroke-width="2"
      opacity="0.25"
    />

    <ellipse
      cx="750"
      cy="478"
      rx="260"
      ry="95"
      fill="none"
      stroke="#91b5d8"
      stroke-width="2"
      opacity="0.25"
    />

    <!-- longitude -->
    <ellipse
      cx="750"
      cy="478"
      rx="140"
      ry="145"
      fill="none"
      stroke="#91b5d8"
      stroke-width="2"
      opacity="0.25"
    />

    <ellipse
      cx="750"
      cy="478"
      rx="260"
      ry="145"
      fill="none"
      stroke="#91b5d8"
      stroke-width="2"
      opacity="0.18"
    />

  </g>

  <!-- ====================================================== -->
  <!-- GLOBAL CONNECTION LINES -->
  <!-- ====================================================== -->

  <path
    d="M 450 350 Q 600 230 750 315"
    fill="none"
    stroke="#4e8da0"
    stroke-width="2"
    stroke-dasharray="7 8"
    opacity="0.7"
  />

  <path
    d="M 750 315 Q 930 210 1070 350"
    fill="none"
    stroke="#4e8da0"
    stroke-width="2"
    stroke-dasharray="7 8"
    opacity="0.7"
  />

  <path
    d="M 480 400 Q 700 285 1030 390"
    fill="none"
    stroke="#6e9eb2"
    stroke-width="2"
    stroke-dasharray="5 10"
    opacity="0.5"
  />

  ${pinSVG(480, 350, "#f29d7d")}
  ${pinSVG(610, 315, "#e3b55e")}
  ${pinSVG(820, 320, "#5ca487")}
  ${pinSVG(960, 350, "#e27e78")}
  ${pinSVG(1050, 390, "#6d9dc5")}

  <!-- ====================================================== -->
  <!-- ARC LOGO -->
  <!-- ====================================================== -->

  <g filter="url(#shadow)">
    ${arcLogoSVG(750, 178, 205)}
  </g>

  <!-- ====================================================== -->
  <!-- TOKEN ECOSYSTEM -->
  <!-- ====================================================== -->

  ${tokenSVG(590, 100, "USDC", "#2775ca", "$")}

  ${tokenSVG(875, 105, "EURC", "#4e74bd", "€")}

  ${tokenSVG(965, 190, "USYC", "#32705f", "Y")}

  ${tokenSVG(535, 195, "cirBTC", "#d89235", "₿")}

  <!-- ====================================================== -->
  <!-- BLOCKCHAIN UI CUBES -->
  <!-- ====================================================== -->

  <g transform="translate(1010 260)">

    <rect
      width="78"
      height="78"
      rx="13"
      fill="#ffffff"
      opacity="0.95"
      filter="url(#shadow)"
    />

    <path
      d="
        M 39 16
        L 62 29
        L 39 42
        L 16 29
        Z
      "
      fill="#5f87b3"
    />

    <path
      d="
        M 16 29
        L 39 42
        L 39 66
        L 16 53
        Z
      "
      fill="#3d638f"
    />

    <path
      d="
        M 62 29
        L 39 42
        L 39 66
        L 62 53
        Z
      "
      fill="#7ca2ca"
    />

  </g>

  <g transform="translate(1100 305)">

    <rect
      width="70"
      height="70"
      rx="13"
      fill="#ffffff"
      opacity="0.95"
      filter="url(#shadow)"
    />

    <circle
      cx="35"
      cy="35"
      r="19"
      fill="none"
      stroke="#3f7b6e"
      stroke-width="5"
    />

    <circle
      cx="35"
      cy="35"
      r="5"
      fill="#3f7b6e"
    />

    <path
      d="
        M 35 16
        L 35 8
        M 35 62
        L 35 54
        M 16 35
        L 8 35
        M 62 35
        L 54 35
      "
      stroke="#3f7b6e"
      stroke-width="4"
      stroke-linecap="round"
    />

  </g>

  <!-- ====================================================== -->
  <!-- COMMUNITY PEOPLE -->
  <!-- ====================================================== -->

  ${personSVG(350, 350, 0.85, "#9b654b", "#31678b", "#253b5c")}

  ${personSVG(575, 405, 0.8, "#633f32", "#d88b6b", "#263852")}

  ${personSVG(945, 390, 0.8, "#b87759", "#34755e", "#222f48")}

  ${personSVG(1150, 375, 0.82, "#80503c", "#d49b4b", "#263650")}

  <!-- ====================================================== -->
  <!-- LAPTOPS -->
  <!-- ====================================================== -->

  <g transform="translate(330 372)">
    <rect
      x="0"
      y="0"
      width="68"
      height="43"
      rx="5"
      fill="#182742"
    />

    <rect
      x="6"
      y="6"
      width="56"
      height="30"
      fill="#9dc5d7"
    />

    <path
      d="M -8 44 L 76 44 L 67 51 L 2 51 Z"
      fill="#354663"
    />
  </g>

  <g transform="translate(895 410)">
    <rect
      x="0"
      y="0"
      width="70"
      height="44"
      rx="5"
      fill="#182742"
    />

    <rect
      x="6"
      y="6"
      width="58"
      height="31"
      fill="#92b9d4"
    />

    <path
      d="M -8 45 L 78 45 L 68 52 L 2 52 Z"
      fill="#354663"
    />
  </g>

  <!-- ====================================================== -->
  <!-- CUSTOMIZABLE AVATAR -->
  <!-- ====================================================== -->

  ${avatarSVG}

  <!-- avatar ring -->
  <circle
    cx="${AVATAR.cx}"
    cy="${AVATAR.cy}"
    r="${AVATAR.r + 8}"
    fill="none"
    stroke="#ffffff"
    stroke-width="7"
  />

  <circle
    cx="${AVATAR.cx}"
    cy="${AVATAR.cy}"
    r="${AVATAR.r + 12}"
    fill="none"
    stroke="#d9cfc5"
    stroke-width="2"
  />

  <!-- ====================================================== -->
  <!-- CUSTOMIZABLE FLAG -->
  <!-- ====================================================== -->

  ${flagSVG}

  <!-- ====================================================== -->
  <!-- NAME / CHAPTER -->
  <!-- ====================================================== -->

  ${nameSVG}

  ${chapterSVG}

  <!-- subtle location indicator -->
  <circle
    cx="${CHAPTER.x - 27}"
    cy="${CHAPTER.y - 5}"
    r="10"
    fill="#0b1630"
  />

  <circle
    cx="${CHAPTER.x - 27}"
    cy="${CHAPTER.y - 8}"
    r="3"
    fill="#ffffff"
  />

  <!-- ====================================================== -->
  <!-- SMALL BUILDER DETAILS -->
  <!-- ====================================================== -->

  <g opacity="0.55">

    <circle
      cx="260"
      cy="80"
      r="5"
      fill="#e3a36d"
    />

    <circle
      cx="315"
      cy="115"
      r="4"
      fill="#5d947c"
    />

    <circle
      cx="1020"
      cy="90"
      r="5"
      fill="#5d8cb0"
    />

    <circle
      cx="1140"
      cy="60"
      r="4"
      fill="#d98b77"
    />

    <circle
      cx="1260"
      cy="230"
      r="5"
      fill="#dfb45c"
    />

  </g>

  <!-- ====================================================== -->
  <!-- BOTTOM ARC -->
  <!-- ====================================================== -->

  <path
    d="
      M 0 470
      C 250 425 450 485 700 455
      C 950 425 1200 480 1500 430
      L 1500 500
      L 0 500
      Z
    "
    fill="#0b1630"
    opacity="0.96"
  />

  <path
    d="
      M 0 470
      C 250 425 450 485 700 455
      C 950 425 1200 480 1500 430
    "
    fill="none"
    stroke="#6f9f94"
    stroke-width="3"
    opacity="0.8"
  />

  <!-- bottom architectural accents -->

  <g transform="translate(40 445)">
    <rect
      width="75"
      height="35"
      rx="5"
      fill="#243b60"
    />

    <rect
      x="13"
      y="8"
      width="15"
      height="20"
      fill="#7695b7"
    />

    <rect
      x="37"
      y="8"
      width="15"
      height="20"
      fill="#7695b7"
    />
  </g>

  <g transform="translate(1380 440)">
    <rect
      width="70"
      height="40"
      rx="5"
      fill="#2d624f"
    />

    <circle
      cx="20"
      cy="20"
      r="7"
      fill="#9ac4a8"
    />

    <circle
      cx="48"
      cy="20"
      r="7"
      fill="#9ac4a8"
    />
  </g>

</svg>
`;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function BannerGenerator() {
  const previewRef = useRef<HTMLImageElement>(null);

  const [openPanel, setOpenPanel] = useState("avatar");

  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [flagSrc, setFlagSrc] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [chapter, setChapter] = useState("");

  const [avatarScale, setAvatarScale] = useState(1);
  const [avatarPan, setAvatarPan] = useState<Pan>({
    x: 0,
    y: 0,
  });

  const [flagScale, setFlagScale] = useState(1);
  const [flagPan, setFlagPan] = useState<Pan>({
    x: 0,
    y: 0,
  });

  const [nameFont, setNameFont] = useState(
    "Arial, sans-serif"
  );

  const [nameSize, setNameSize] = useState(52);

  const [namePan, setNamePan] = useState<Pan>({
    x: 0,
    y: 0,
  });

  const [chapterFont, setChapterFont] = useState(
    "Arial, sans-serif"
  );

  const [chapterSize, setChapterSize] = useState(38);

  const [chapterPan, setChapterPan] = useState<Pan>({
    x: 0,
    y: 0,
  });

  // ==========================================================
  // CREATE SVG
  // ==========================================================

  const svg = useMemo(() => {
    return createBannerSVG({
      avatar: avatarSrc,
      flag: flagSrc,

      name,
      chapter,

      avatarScale,
      avatarPan,

      flagScale,
      flagPan,

      nameFont,
      nameSize,
      namePan,

      chapterFont,
      chapterSize,
      chapterPan,
    });
  }, [
    avatarSrc,
    flagSrc,
    name,
    chapter,

    avatarScale,
    avatarPan,

    flagScale,
    flagPan,

    nameFont,
    nameSize,
    namePan,

    chapterFont,
    chapterSize,
    chapterPan,
  ]);

  // ==========================================================
  // PREVIEW
  // ==========================================================

  const previewURL = useMemo(() => {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      svg
    )}`;
  }, [svg]);

  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.src = previewURL;
    }
  }, [previewURL]);

  // ==========================================================
  // FILE UPLOAD
  // ==========================================================

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<
      React.SetStateAction<string | null>
    >
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const dataURL = await loadFileAsDataURL(file);
      setter(dataURL);
    } catch (error) {
      console.error(error);
    }
  };

  // ==========================================================
  // SVG DOWNLOAD
  // ==========================================================

  const handleDownloadSVG = () => {
    const blob = new Blob([svg], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "arc-community-banner.svg";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ==========================================================
  // PNG DOWNLOAD
  // SVG → PNG
  // ==========================================================

  const handleDownloadPNG = async () => {
    try {
      const blob = new Blob([svg], {
        type: "image/svg+xml;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);

      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");

        canvas.width = 1500;
        canvas.height = 500;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          URL.revokeObjectURL(url);
          return;
        }

        ctx.drawImage(
          image,
          0,
          0,
          1500,
          500
        );

        URL.revokeObjectURL(url);

        canvas.toBlob((pngBlob) => {
          if (!pngBlob) return;

          const pngURL =
            URL.createObjectURL(pngBlob);

          const link =
            document.createElement("a");

          link.href = pngURL;
          link.download =
            "arc-community-banner-1500x500.png";

          document.body.appendChild(link);

          link.click();

          document.body.removeChild(link);

          URL.revokeObjectURL(pngURL);
        }, "image/png");
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
      };

      image.src = url;
    } catch (error) {
      console.error(
        "PNG export failed:",
        error
      );
    }
  };

  // ==========================================================
  // RESET
  // ==========================================================

  const handleReset = () => {
    setAvatarSrc(null);
    setFlagSrc(null);

    setName("");
    setChapter("");

    setAvatarScale(1);
    setAvatarPan({ x: 0, y: 0 });

    setFlagScale(1);
    setFlagPan({ x: 0, y: 0 });

    setNameFont("Arial, sans-serif");
    setNameSize(52);
    setNamePan({ x: 0, y: 0 });

    setChapterFont("Arial, sans-serif");
    setChapterSize(38);
    setChapterPan({ x: 0, y: 0 });
  };

  const togglePanel = (panel: string) => {
    setOpenPanel(
      openPanel === panel ? "" : panel
    );
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f8f3ed] to-[#ebe5dd] px-4 py-8">

      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-8 text-center">

          <div className="inline-flex items-center gap-2 rounded-full bg-[#0b1630] px-4 py-2 text-xs font-semibold text-white">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            ARC COMMUNITY
          </div>

          <h1 className="mt-4 text-3xl font-bold text-[#0b1630]">
            Arc-tist Banner Generator
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
            Create your own customizable Arc community
            banner. Everything is generated as vector SVG.
          </p>

        </div>

        {/* PREVIEW */}
        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">

          <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="font-bold text-[#0b1630]">
                Live Preview
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Native SVG · 1500 × 500
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              <button
                onClick={handleDownloadSVG}
                className="rounded-xl border border-[#0b1630] bg-white px-4 py-2.5 text-sm font-semibold text-[#0b1630] transition hover:bg-gray-50"
              >
                Download SVG
              </button>

              <button
                onClick={handleDownloadPNG}
                className="rounded-xl bg-[#0b1630] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#172650]"
              >
                Download PNG
              </button>

            </div>

          </div>

          <div className="bg-[#071126] p-2 sm:p-4">

            <div className="overflow-hidden rounded-xl bg-white shadow-2xl">

              <img
                ref={previewRef}
                src={previewURL}
                alt="Arc community banner preview"
                className="block w-full"
                style={{
                  aspectRatio: "1500 / 500",
                }}
              />

            </div>

          </div>

        </section>

        {/* CONTROLS */}
        <div className="mt-6 space-y-3">

          {/* AVATAR */}
          <Accordion
            title="Profile Photo"
            icon={<AvatarIcon />}
            open={openPanel === "avatar"}
            onClick={() =>
              togglePanel("avatar")
            }
          >

            <ImageControls
              label="Upload profile photo"
              preview={avatarSrc}
              onChange={(e) =>
                handleImageUpload(
                  e,
                  setAvatarSrc
                )
              }
              onClear={() => {
                setAvatarSrc(null);
                setAvatarScale(1);
                setAvatarPan({
                  x: 0,
                  y: 0,
                });
              }}
              scale={avatarScale}
              onScaleChange={
                setAvatarScale
              }
              pan={avatarPan}
              onPanChange={setAvatarPan}
            />

          </Accordion>

          {/* FLAG */}
          <Accordion
            title="Country / Chapter Flag"
            icon={<FlagIcon />}
            open={openPanel === "flag"}
            onClick={() =>
              togglePanel("flag")
            }
          >

            <ImageControls
              label="Upload country or chapter flag"
              preview={flagSrc}
              onChange={(e) =>
                handleImageUpload(
                  e,
                  setFlagSrc
                )
              }
              onClear={() => {
                setFlagSrc(null);
                setFlagScale(1);
                setFlagPan({
                  x: 0,
                  y: 0,
                });
              }}
              scale={flagScale}
              onScaleChange={
                setFlagScale
              }
              pan={flagPan}
              onPanChange={setFlagPan}
            />

          </Accordion>

          {/* NAME */}
          <Accordion
            title="Your Name"
            icon={<PersonIcon />}
            open={openPanel === "name"}
            onClick={() =>
              togglePanel("name")
            }
          >

            <TextControls
              value={name}
              placeholder="e.g. Chima Ozoemena"
              maxLength={35}
              onChange={setName}
              fontFamily={nameFont}
              onFontChange={setNameFont}
              fontSize={nameSize}
              onSizeChange={setNameSize}
              pan={namePan}
              onPanChange={setNamePan}
            />

          </Accordion>

          {/* CHAPTER */}
          <Accordion
            title="Chapter / Location"
            icon={<GlobeIcon />}
            open={openPanel === "chapter"}
            onClick={() =>
              togglePanel("chapter")
            }
          >

            <TextControls
              value={chapter}
              placeholder="e.g. Arc Nigeria"
              maxLength={35}
              onChange={setChapter}
              fontFamily={chapterFont}
              onFontChange={setChapterFont}
              fontSize={chapterSize}
              onSizeChange={setChapterSize}
              pan={chapterPan}
              onPanChange={setChapterPan}
            />

          </Accordion>

        </div>

        {/* RESET */}
        <div className="flex justify-end py-5">

          <button
            onClick={handleReset}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50 hover:text-red-700"
          >
            Reset All Fields
          </button>

        </div>

        <div className="pb-8 text-center text-xs text-gray-400">

          Your banner is generated locally in your browser.
          <br />
          SVG output is exactly 1500 × 500 pixels.

        </div>

      </div>

    </main>
  );
}

// ============================================================
// ACCORDION
// ============================================================

interface AccordionProps {
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function Accordion({
  title,
  icon,
  open,
  onClick,
  children,
}: AccordionProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

      <button
        onClick={onClick}
        className="flex w-full items-center justify-between px-5 py-4 transition hover:bg-gray-50"
      >

        <div className="flex items-center gap-3">

          <span className="rounded-xl bg-[#f1f3f7] p-2 text-[#0b1630]">
            {icon}
          </span>

          <span className="text-sm font-semibold text-[#0b1630]">
            {title}
          </span>

        </div>

        <span className="text-gray-400">
          {open ? (
            <ChevronUpIcon />
          ) : (
            <ChevronDownIcon />
          )}
        </span>

      </button>

      {open && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-5">
          {children}
        </div>
      )}

    </div>
  );
}

// ============================================================
// IMAGE CONTROLS
// ============================================================

interface ImageControlsProps {
  label: string;
  preview: string | null;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  onClear: () => void;
  scale: number;
  onScaleChange: (value: number) => void;
  pan: Pan;
  onPanChange: (value: Pan) => void;
}

function ImageControls({
  label,
  preview,
  onChange,
  onClear,
  scale,
  onScaleChange,
  pan,
  onPanChange,
}: ImageControlsProps) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  return (
    <div className="max-w-3xl space-y-5">

      {!preview ? (
        <button
          onClick={() =>
            inputRef.current?.click()
          }
          className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 bg-white transition hover:border-[#0b1630] hover:bg-gray-50"
        >

          <span className="text-2xl">
            +
          </span>

          <span className="text-xs font-semibold text-gray-500">
            {label}
          </span>

        </button>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3">

            <span className="text-xs font-semibold text-emerald-600">
              ● Image uploaded
            </span>

            <div className="flex gap-2">

              <button
                onClick={() =>
                  inputRef.current?.click()
                }
                className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-[#0b1630]"
              >
                Change
              </button>

              <button
                onClick={onClear}
                className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600"
              >
                Remove
              </button>

            </div>

          </div>

          <div className="grid gap-5 rounded-xl border border-gray-100 bg-white p-5 md:grid-cols-3">

            <Range
              label="Zoom"
              value={scale}
              min={0.5}
              max={3}
              step={0.05}
              onChange={onScaleChange}
            />

            <Range
              label="Horizontal"
              value={pan.x}
              min={-250}
              max={250}
              step={5}
              onChange={(value) =>
                onPanChange({
                  ...pan,
                  x: value,
                })
              }
            />

            <Range
              label="Vertical"
              value={pan.y}
              min={-250}
              max={250}
              step={5}
              onChange={(value) =>
                onPanChange({
                  ...pan,
                  y: value,
                })
              }
            />

          </div>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onChange}
        className="hidden"
      />

    </div>
  );
}

// ============================================================
// RANGE
// ============================================================

interface RangeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

function Range({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: RangeProps) {
  return (
    <div className="space-y-2">

      <div className="flex justify-between">

        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          {label}
        </label>

        <span className="text-[10px] font-bold text-[#0b1630]">
          {value}
        </span>

      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) =>
          onChange(
            Number(e.target.value)
          )
        }
        className="w-full accent-[#0b1630]"
      />

    </div>
  );
}

// ============================================================
// TEXT CONTROLS
// ============================================================

interface TextControlsProps {
  value: string;
  placeholder: string;
  maxLength: number;
  onChange: (value: string) => void;

  fontFamily: string;
  onFontChange: (value: string) => void;

  fontSize: number;
  onSizeChange: (value: number) => void;

  pan: Pan;
  onPanChange: (value: Pan) => void;
}

function TextControls({
  value,
  placeholder,
  maxLength,
  onChange,
  fontFamily,
  onFontChange,
  fontSize,
  onSizeChange,
  pan,
  onPanChange,
}: TextControlsProps) {
  return (
    <div className="max-w-3xl space-y-5">

      <div className="relative">

        <input
          type="text"
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={(e) =>
            onChange(e.target.value)
          }
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 pr-20 text-sm font-medium text-[#0b1630] outline-none focus:border-[#0b1630]"
        />

        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
          {value.length}/{maxLength}
        </span>

      </div>

      <div className="grid gap-5 rounded-xl border border-gray-100 bg-white p-5 sm:grid-cols-2">

        <div>

          <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Font
          </label>

          <select
            value={fontFamily}
            onChange={(e) =>
              onFontChange(e.target.value)
            }
            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm"
          >

            <option value="Arial, sans-serif">
              Arial
            </option>

            <option value="Georgia, serif">
              Georgia
            </option>

            <option value="Verdana, sans-serif">
              Verdana
            </option>

            <option value="Trebuchet MS, sans-serif">
              Trebuchet
            </option>

            <option value="Times New Roman, serif">
              Times New Roman
            </option>

          </select>

        </div>

        <Range
          label="Font Size"
          value={fontSize}
          min={20}
          max={100}
          step={1}
          onChange={onSizeChange}
        />

        <Range
          label="Horizontal"
          value={pan.x}
          min={-150}
          max={150}
          step={5}
          onChange={(x) =>
            onPanChange({
              ...pan,
              x,
            })
          }
        />

        <Range
          label="Vertical"
          value={pan.y}
          min={-100}
          max={100}
          step={5}
          onChange={(y) =>
            onPanChange({
              ...pan,
              y,
            })
          }
        />

      </div>

    </div>
  );
}

// ============================================================
// ICONS
// ============================================================

function AvatarIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}
