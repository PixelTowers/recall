// ABOUTME: Form field detection, label extraction, and CSS selector generation.
// ABOUTME: Used by the content script to capture and identify form fields on a page.

const SUPPORTED_INPUT_TYPES = [
  "text",
  "email",
  "password",
  "search",
  "tel",
  "url",
  "number",
  "date",
  "datetime-local",
  "month",
  "week",
  "time",
  "color",
];

/**
 * Generates a unique CSS selector for an element.
 * Prefers id-based selectors, falls back to a path of nth-child selectors.
 */
export function generateSelector(element) {
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }

  const parts = [];
  let current = element;

  while (current && current !== document.documentElement) {
    if (current.id) {
      parts.unshift(`#${CSS.escape(current.id)}`);
      break;
    }

    const parent = current.parentElement;
    if (!parent) {
      parts.unshift(current.tagName.toLowerCase());
      break;
    }

    const siblings = Array.from(parent.children);
    const index = siblings.indexOf(current) + 1;
    parts.unshift(`${current.tagName.toLowerCase()}:nth-child(${index})`);
    current = parent;
  }

  return parts.join(" > ");
}

/**
 * Extracts the label text for a form element using a 6-level priority:
 * 1. Explicit <label for="id">
 * 2. Parent <label> wrapping the input
 * 3. aria-label or aria-labelledby
 * 4. Preceding sibling text
 * 5. placeholder attribute
 * 6. name or id attribute
 */
export function extractLabel(element) {
  // 1. Explicit <label for="id">
  if (element.id) {
    const label = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
    if (label) {
      return label.textContent.trim();
    }
  }

  // 2. Parent <label> wrapping the input
  const parentLabel = element.closest("label");
  if (parentLabel) {
    // Get text content excluding the input element itself
    const clone = parentLabel.cloneNode(true);
    const inputs = clone.querySelectorAll("input, textarea, select");
    inputs.forEach((input) => input.remove());
    const text = clone.textContent.trim();
    if (text) {
      return text;
    }
  }

  // 3. aria-label or aria-labelledby
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) {
    return ariaLabel.trim();
  }

  const ariaLabelledBy = element.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy);
    if (labelElement) {
      return labelElement.textContent.trim();
    }
  }

  // 4. Preceding sibling text
  const previousSibling = element.previousElementSibling;
  if (previousSibling) {
    const text = previousSibling.textContent.trim();
    if (text) {
      return text;
    }
  }

  // 5. placeholder attribute
  const placeholder = element.getAttribute("placeholder");
  if (placeholder) {
    return placeholder.trim();
  }

  // 6. name or id attribute
  const name = element.getAttribute("name");
  if (name) {
    return name;
  }

  return element.id || "Unknown field";
}

/**
 * Returns the value of a form element, handling different input types.
 */
export function getFieldValue(element) {
  if (element.type === "checkbox") {
    return element.checked ? "true" : "false";
  }
  if (element.type === "radio") {
    return element.checked ? element.value : "";
  }
  if (element.tagName.toLowerCase() === "select") {
    return element.value;
  }
  return element.value || "";
}

/**
 * Detects all form fields on the page.
 * Returns elements from both inside forms and standalone.
 */
export function detectFields() {
  const selectors = [
    ...SUPPORTED_INPUT_TYPES.map((type) => `input[type="${type}"]`),
    "input:not([type])",
    "textarea",
    "select",
    'input[type="checkbox"]',
    'input[type="radio"]',
  ];

  const elements = document.querySelectorAll(selectors.join(", "));
  return Array.from(elements);
}

/**
 * Captures all form fields on the page, returning an array of Field objects.
 * Each Field contains: label, value, selector, type.
 */
export function captureFields() {
  const elements = detectFields();

  return elements.map((element) => ({
    label: extractLabel(element),
    value: getFieldValue(element),
    selector: generateSelector(element),
    type: element.type || element.tagName.toLowerCase(),
  }));
}
