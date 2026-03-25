// ABOUTME: Unit tests for form field detection, label extraction, and selector generation.
// ABOUTME: Uses jsdom to simulate various form structures for comprehensive testing.

import { describe, it, expect, beforeEach } from "vitest";
import {
  generateSelector,
  extractLabel,
  getFieldValue,
  detectFields,
  captureFields,
} from "../src/lib/fields.js";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("generateSelector", () => {
  it("returns id-based selector when element has an id", () => {
    document.body.innerHTML = '<input id="username" type="text">';
    const el = document.querySelector("#username");
    expect(generateSelector(el)).toBe("#username");
  });

  it("escapes special characters in id selectors", () => {
    document.body.innerHTML = '<input id="field.name" type="text">';
    const el = document.querySelector('[id="field.name"]');
    const selector = generateSelector(el);
    expect(document.querySelector(selector)).toBe(el);
  });

  it("falls back to nth-child path when no id exists", () => {
    document.body.innerHTML = `
      <form>
        <input type="text">
        <input type="email">
      </form>
    `;
    const el = document.querySelectorAll("input")[1];
    const selector = generateSelector(el);
    expect(document.querySelector(selector)).toBe(el);
  });

  it("uses ancestor id to shorten the path", () => {
    document.body.innerHTML = `
      <div id="form-wrapper">
        <div>
          <input type="text">
        </div>
      </div>
    `;
    const el = document.querySelector("input");
    const selector = generateSelector(el);
    expect(selector).toContain("#form-wrapper");
    expect(document.querySelector(selector)).toBe(el);
  });
});

describe("extractLabel", () => {
  it("level 1: finds explicit label[for] association", () => {
    document.body.innerHTML = `
      <label for="email">Email Address</label>
      <input id="email" type="email">
    `;
    const el = document.querySelector("#email");
    expect(extractLabel(el)).toBe("Email Address");
  });

  it("level 2: finds parent label wrapping the input", () => {
    document.body.innerHTML = `
      <label>
        Full Name
        <input type="text">
      </label>
    `;
    const el = document.querySelector("input");
    expect(extractLabel(el)).toBe("Full Name");
  });

  it("level 3: reads aria-label attribute", () => {
    document.body.innerHTML = '<input type="text" aria-label="Search query">';
    const el = document.querySelector("input");
    expect(extractLabel(el)).toBe("Search query");
  });

  it("level 3: reads aria-labelledby attribute", () => {
    document.body.innerHTML = `
      <span id="desc">Phone Number</span>
      <input type="tel" aria-labelledby="desc">
    `;
    const el = document.querySelector("input");
    expect(extractLabel(el)).toBe("Phone Number");
  });

  it("level 4: reads preceding sibling text", () => {
    document.body.innerHTML = `
      <div>
        <span>Company Name</span>
        <input type="text">
      </div>
    `;
    const el = document.querySelector("input");
    expect(extractLabel(el)).toBe("Company Name");
  });

  it("level 5: reads placeholder attribute", () => {
    document.body.innerHTML = '<input type="text" placeholder="Enter your name">';
    const el = document.querySelector("input");
    expect(extractLabel(el)).toBe("Enter your name");
  });

  it("level 6: falls back to name attribute", () => {
    document.body.innerHTML = '<input type="text" name="first_name">';
    const el = document.querySelector("input");
    expect(extractLabel(el)).toBe("first_name");
  });

  it("level 6: falls back to id attribute", () => {
    document.body.innerHTML = '<input type="text" id="field_id">';
    // No label[for] exists, so id is used as last resort via the name/id fallback
    // But first it checks label[for="field_id"] which doesn't exist
    const el = document.querySelector("input");
    expect(extractLabel(el)).toBe("field_id");
  });

  it("follows priority order: label[for] over aria-label", () => {
    document.body.innerHTML = `
      <label for="f1">Explicit Label</label>
      <input id="f1" type="text" aria-label="Aria Label" placeholder="Placeholder">
    `;
    const el = document.querySelector("#f1");
    expect(extractLabel(el)).toBe("Explicit Label");
  });

  it("follows priority order: aria-label over placeholder", () => {
    document.body.innerHTML = '<input type="text" aria-label="Aria" placeholder="Place">';
    const el = document.querySelector("input");
    expect(extractLabel(el)).toBe("Aria");
  });
});

describe("getFieldValue", () => {
  it("returns text input value", () => {
    document.body.innerHTML = '<input type="text" value="hello">';
    const el = document.querySelector("input");
    expect(getFieldValue(el)).toBe("hello");
  });

  it('returns "true" for checked checkbox', () => {
    document.body.innerHTML = '<input type="checkbox" checked>';
    const el = document.querySelector("input");
    expect(getFieldValue(el)).toBe("true");
  });

  it('returns "false" for unchecked checkbox', () => {
    document.body.innerHTML = '<input type="checkbox">';
    const el = document.querySelector("input");
    expect(getFieldValue(el)).toBe("false");
  });

  it("returns value for checked radio button", () => {
    document.body.innerHTML = '<input type="radio" value="option1" checked>';
    const el = document.querySelector("input");
    expect(getFieldValue(el)).toBe("option1");
  });

  it("returns empty string for unchecked radio button", () => {
    document.body.innerHTML = '<input type="radio" value="option1">';
    const el = document.querySelector("input");
    expect(getFieldValue(el)).toBe("");
  });

  it("returns select value", () => {
    document.body.innerHTML = `
      <select>
        <option value="a">A</option>
        <option value="b" selected>B</option>
      </select>
    `;
    const el = document.querySelector("select");
    expect(getFieldValue(el)).toBe("b");
  });

  it("returns textarea value", () => {
    document.body.innerHTML = "<textarea>Some long text</textarea>";
    const el = document.querySelector("textarea");
    expect(getFieldValue(el)).toBe("Some long text");
  });
});

describe("detectFields", () => {
  it("finds text inputs", () => {
    document.body.innerHTML = '<input type="text"><input type="email">';
    expect(detectFields()).toHaveLength(2);
  });

  it("finds textareas", () => {
    document.body.innerHTML = "<textarea></textarea>";
    expect(detectFields()).toHaveLength(1);
  });

  it("finds select elements", () => {
    document.body.innerHTML = "<select><option>A</option></select>";
    expect(detectFields()).toHaveLength(1);
  });

  it("finds checkboxes and radio buttons", () => {
    document.body.innerHTML =
      '<input type="checkbox"><input type="radio">';
    expect(detectFields()).toHaveLength(2);
  });

  it("finds inputs without type attribute (defaults to text)", () => {
    document.body.innerHTML = "<input>";
    expect(detectFields()).toHaveLength(1);
  });

  it("finds fields both inside and outside forms", () => {
    document.body.innerHTML = `
      <form><input type="text"></form>
      <input type="email">
    `;
    expect(detectFields()).toHaveLength(2);
  });

  it("ignores hidden and submit inputs", () => {
    document.body.innerHTML =
      '<input type="hidden"><input type="submit"><input type="button">';
    expect(detectFields()).toHaveLength(0);
  });
});

describe("captureFields", () => {
  it("returns Field objects with label, value, selector, and type", () => {
    document.body.innerHTML = `
      <label for="name">Your Name</label>
      <input id="name" type="text" value="Alice">
    `;

    const fields = captureFields();
    expect(fields).toHaveLength(1);
    expect(fields[0]).toEqual({
      label: "Your Name",
      value: "Alice",
      selector: "#name",
      type: "text",
    });
  });

  it("captures multiple fields from a form", () => {
    document.body.innerHTML = `
      <form>
        <label for="email">Email</label>
        <input id="email" type="email" value="a@b.com">
        <label for="msg">Message</label>
        <textarea id="msg">Hello</textarea>
      </form>
    `;

    const fields = captureFields();
    expect(fields).toHaveLength(2);
    expect(fields[0].label).toBe("Email");
    expect(fields[0].value).toBe("a@b.com");
    expect(fields[1].label).toBe("Message");
    expect(fields[1].value).toBe("Hello");
  });
});
