// ABOUTME: Test setup file for vitest with jsdom environment.
// ABOUTME: Polyfills browser APIs not available in jsdom (e.g. CSS.escape).

if (typeof globalThis.CSS === "undefined") {
  globalThis.CSS = {};
}

if (typeof globalThis.CSS.escape !== "function") {
  // Polyfill CSS.escape per https://drafts.csswg.org/cssom/#the-css.escape()-method
  globalThis.CSS.escape = function (value) {
    const str = String(value);
    const length = str.length;
    let result = "";

    for (let i = 0; i < length; i++) {
      const char = str.charAt(i);
      const code = str.charCodeAt(i);

      if (code === 0) {
        result += "\uFFFD";
      } else if (
        (code >= 0x0001 && code <= 0x001f) ||
        code === 0x007f ||
        (i === 0 && code >= 0x0030 && code <= 0x0039) ||
        (i === 1 && code >= 0x0030 && code <= 0x0039 && str.charCodeAt(0) === 0x002d)
      ) {
        result += "\\" + code.toString(16) + " ";
      } else if (
        code >= 0x0080 ||
        code === 0x002d ||
        code === 0x005f ||
        (code >= 0x0030 && code <= 0x0039) ||
        (code >= 0x0041 && code <= 0x005a) ||
        (code >= 0x0061 && code <= 0x007a)
      ) {
        result += char;
      } else {
        result += "\\" + char;
      }
    }

    return result;
  };
}
