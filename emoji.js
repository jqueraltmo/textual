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
    air_sym: "🜁",
    fire_sym: "🜂",
    earth_sym: "🜃",
    water_sym: "🜄",

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
    sun_sym: "☉",
    moon_sym: "☾",
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
    mercury_sublimate: "🜐",
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
    sal_ammoniac: "🜹",

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
    moon: "🌙",
    earth: "🌍"
};

const PATTERN = /:([a-z0-9_+-]+):?/gi;

/**
 * Replaces :shortcode and :shortcode: with their emoji or symbol.
 * Unknown shortcodes are left untouched.
 */
export function expandEmojis(text) {
    return text.replace(PATTERN, (match, name) => {
        return EMOJI[name.toLowerCase()] ?? match;
    });
}