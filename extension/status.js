/* SPDX-License-Identifier: MIT */
browser.runtime.onMessage.addListener(message => {
  if (message?.type !== "subscript:status") return undefined;
  const states = [...document.querySelectorAll('[data-composer-body] .ProseMirror[contenteditable="true"], #prompt-textarea.ProseMirror[contenteditable="true"]')]
    .map(element => element.dataset.subscriptState || "unavailable");
  return Promise.resolve({states});
});
