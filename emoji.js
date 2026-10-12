"use strict";

/**
 * Emoji and symbol expansion.
 * Applied to text content at render time by resolveText() in core.js.
 *
 * Covers:
 *   - Alchemical elements and substances
 *   - Zodiac signs
 *   - Classical and modern planets
 *   - A small set of everyday emojis
 */

export const EMOJI = {
    // ---------------------------------------------------------------
    // The four (five) elements
    // ---------------------------------------------------------------
    quintessence: "🜀",
    aether: "🜀",
    ether: "🜀",
    "air-sym": "🜁",
    "fire-sym": "🜂",
    "earth-sym": "🜃",
    "water-sym": "🜄",

    // ---------------------------------------------------------------
    // Zodiac signs
    // ---------------------------------------------------------------
    aries: "♈",
    taurus: "♉",
    gemini: "♊",
    cancer: "♋",
    leo: "♌",
    virgo: "♍",
    libra: "♎",
    scorpio: "♏",
    sagittarius: "♐",
    capricorn: "♑",
    aquarius: "♒",
    pisces: "♓",

    // ---------------------------------------------------------------
    // Planets
    // ---------------------------------------------------------------
    "sun-sym": "☉",
    "moon-sym": "☾",
    mercury: "☿",
    venus: "♀",
    mars: "♂",
    jupiter: "♃",
    saturn: "♄",
    uranus: "⛢",
    neptune: "♆",
    pluto: "♇",

    // ---------------------------------------------------------------
    // Alchemical substances and metals
    // ---------------------------------------------------------------
    sulfur: "🜍",
    sulphur: "🜍",
    "mercury-sublimate": "🜐",
    salt: "🜔",
    nitre: "🜕",
    niter: "🜕",
    vitriol: "🜖",
    gold: "🜚",
    silver: "🜛",
    iron: "🜜",
    copper: "🜠",
    tin: "🜩",
    lead: "🜪",
    antimony: "🜫",
    arsenic: "🜺",
    "sal-ammoniac": "🜹",

    // ---------------------------------------------------------------
    // Everyday emojis
    // ---------------------------------------------------------------
    heart: "❤️",
    smile: "😊",
    grin: "😁",
    joy: "😂",
    cry: "😢",
    wink: "😉",
    thinking: "🤔",
    thumbsup: "👍",
    "+1": "👍",
    thumbsdown: "👎",
    "-1": "👎",
    fire: "🔥",
    star: "⭐",
    sparkles: "✨",
    rocket: "🚀",
    tada: "🎉",
    warning: "⚠️",
    check: "✅",
    x: "❌",
    cat: "🐱",
    dog: "🐶",
    pill: "💊",
    cloud: "☁️",
    umbrella: "☂️",
    snowman: "☃️",
    coffee: "☕",
    sun: "☀️",
    "sun-face": "🌞",
    moon: "🌙",
    "moon-face": "🌝",
    "moon-face-new": "🌚",
    earth: "🌍",
    rabbit: "🐇",
    rainbon: "🌈",
    wave: "🌊",

    // ---------------------------------------------------------------
    // Cycles
    // ---------------------------------------------------------------
    "moon-cycle": ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"],
    "metal-cycle": ["🜜", "🜠", "🜪", "🜩", "🜚", "🜛"],
    "planets-cycle": ["♄", "♃", "♂", "☉", "♀", "☿", "☾"],
    "zodiac-cycle": ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"],
    "zodiac-fire-cycle": ["♈", "♌", "♐"],
    "zodiac-earth-cycle": ["♉", "♍", "♑"],
    "zodiac-air-cycle": ["♊", "♎", "♒"],
    "zodiac-water-cycle": ["♋", "♏", "♓"],
};

const PATTERN = /:([a-z0-9_+-]+):?/gi;

/**
 * Replaces :shortcode and :shortcode: with their emoji or symbol.
 * Unknown shortcodes are left untouched.
 */
function inlineExpand(s) {
    return s.replace(PATTERN, (match, name) => {
        const entry = EMOJI[name.toLowerCase()];
        if (entry === undefined) return match;
        if (Array.isArray(entry)) return entry.join("");
        return entry;
    });
}

/**
 * Replaces :shortcode and :shortcode: with their emoji or symbol.
 * If the symbol is an array, creates an array of expansions.
 * Only one cycle is allowed at this time. More than one cycle results
 * in only one long array.
 */
export function expandEmojis(text) {
    const s = String(text);
    const matches = [...s.matchAll(PATTERN)];
    const cycles = matches.filter(m => Array.isArray(EMOJI[m[1].toLowerCase()]));

    if (cycles.length === 1) {
        const [cycle] = cycles;
        const values = EMOJI[cycle[1].toLowerCase()];
        return values.map(value => {
            const withValue = s.slice(0, cycle.index)
                + value
                + s.slice(cycle.index + cycle[0].length);
            return inlineExpand(withValue);
        });
    }

    return inlineExpand(s);
}
