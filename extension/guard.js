/* SPDX-License-Identifier: MIT */
(() => {
  "use strict";
  const KEY = Symbol.for("subscript-chatgpt:installed:v1");
  if (window[KEY]) return;
  Object.defineProperty(window, KEY, {value: true});

  // This is a ProseMirror input-rule transaction, not arbitrary user formatting.
  // Its metadata contains the exact edit that triggered the rule. Replaying that
  // edit on the original state retains the delimiters, history and selection.
  function literalEdit(transaction) {
    const edit = Object.values(transaction.meta || {}).find(value =>
      value && value.transform === transaction &&
      Number.isInteger(value.from) && Number.isInteger(value.to) &&
      typeof value.text === "string");
    if (!edit) return null;
    const addsItalic = transaction.steps.some(step =>
      step.toJSON().stepType === "addMark" &&
      ["em", "italic"].includes(step.mark?.type.name));
    if (!addsItalic) return null;
    const removesUnderscores = transaction.steps.some((step, index) => {
      const json = step.toJSON();
      if (json.stepType !== "replace" || !(step.to > step.from)) return false;
      const removed = transaction.docs[index].textBetween(step.from, step.to);
      const inserted = step.slice?.content.textBetween(0, step.slice.content.size) || "";
      // Compare the actual replacement, so an underscore inside *a_b* cannot
      // disable asterisk emphasis. Runs also cover nested/triple underscores.
      return removed.startsWith("_") && removed.endsWith("_") &&
        removed.length > inserted.length && removed.includes(inserted);
    });
    return removesUnderscores ? edit : null;
  }

  const attached = new WeakMap();
  const SELECTOR = '[data-composer-body] .ProseMirror[contenteditable="true"], #prompt-textarea.ProseMirror[contenteditable="true"]';
  const isView = (view, element) => view?.dom === element &&
    typeof view.dispatch === "function" && view.state?.tr && !view.isDestroyed;

  function findView(element) {
    // Current ChatGPT exposes its controller in the owning React component's
    // props. Do not crawl application state, chat messages, or arbitrary objects.
    if (isView(element.editor?.view, element)) return element.editor.view;
    for (let node = element, level = 0; node && level < 5; node = node.parentElement, level++) {
      const key = Object.keys(node).find(name => name.startsWith("__reactFiber$"));
      let fiber = key && node[key];
      for (let depth = 0; fiber && depth < 24; fiber = fiber.return, depth++) {
        for (const props of [fiber.memoizedProps, fiber.pendingProps]) {
          const view = props?.composerController?.view;
          if (isView(view, element)) return view;
        }
      }
    }
    return null;
  }

  function protect(element) {
    let record = attached.get(element);
    if (record && isView(record.view, element) && record.view.dispatch === record.wrapper) return true;
    const view = findView(element);
    if (!view) {
      element.dataset.subscriptState = "unavailable";
      return false;
    }
    const original = view.dispatch;
    function dispatch(transaction) {
      const edit = literalEdit(transaction);
      if (edit) transaction = this.state.tr.insertText(edit.text, edit.from, edit.to);
      return Reflect.apply(original, this, [transaction]);
    }
    view.dispatch = dispatch;
    record = {view, wrapper: dispatch};
    attached.set(element, record);
    element.dataset.subscriptState = "active";
    return true;
  }

  function scan() {
    document.querySelectorAll(SELECTOR).forEach(protect);
  }
  // Observe remounts/navigation and also attach synchronously before editing.
  // Composition-end input rules can run asynchronously; the dispatch wrapper
  // remains attached to the view and therefore covers those transactions too.
  for (const event of ["focusin", "beforeinput", "keydown", "paste", "drop", "compositionstart"]) {
    document.addEventListener(event, event => {
      const element = event.target instanceof Element && event.target.closest(SELECTOR);
      if (element) protect(element);
    }, true);
  }
  new MutationObserver(scan).observe(document, {childList: true, subtree: true});
  scan();
})();
