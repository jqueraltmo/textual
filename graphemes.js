'use strict';

const segmenter = new Intl.Segmenter();

/**
 * Splits text into grapheme clusters: user-perceived characters.
 * Keeps composed emojis (like ❤️) and combining marks together.
 */
export function toGraphemes(text) {
    return [...segmenter.segment(text)].map(s => s.segment);
}
