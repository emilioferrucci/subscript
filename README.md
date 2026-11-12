# Subscript — Keep Underscores in ChatGPT

A small Firefox extension that keeps underscore-delimited text literal while
typing in ChatGPT's prompt box. Asterisk italics continue to work. Designed to
run alongside [Still — Manual Scroll for ChatGPT](https://github.com/emilioferrucci/still).

**Experimental, agent-written software. Use entirely at your own risk.**

## Disclaimers — read before installing

- **Written by a coding agent.** An OpenAI coding agent generated the code,
  documentation, and test tooling, and operated the browser during the recorded
  tests. Publishing this repository does not mean Emilio Ferrucci has personally
  reviewed, understood, or verified every line. No independent security audit or
  comprehensive human code review is claimed.
- **No responsibility accepted, to the fullest extent permitted by law.**
  Emilio Ferrucci and the project's authors, copyright holders, maintainers,
  and contributors accept no responsibility or liability for your installation,
  use, modification, or redistribution of this software, or for resulting
  claims, losses, damages, or other consequences. The full MIT license's
  warranty and liability disclaimer applies; see [LICENSE](LICENSE).
- **Provided “AS IS” and “AS AVAILABLE”, without warranties.** There is no
  promise of correctness, security, reliability, fitness for a particular
  purpose, non-infringement, accessibility, or compatibility with your setup.
  Nothing here excludes obligations or liability that cannot legally be excluded.
- **You decide whether to trust and run it.** Review the source and permissions
  yourself. Test in a separate browser profile before relying on it. Potential
  consequences include broken editing or formatting, altered or lost prompt
  text, lost unsaved work, browser instability, and other unintended effects.
  These examples are not exhaustive.
- **Tests are limited evidence.** Recorded tests passed in particular browser
  versions and interface states. They do not guarantee that every automatic
  underscore conversion is blocked in every input method or editor variant, or that the
  software is safe or free of defects. See [TESTING.md](TESTING.md) for observed
  results and limits.
- **ChatGPT can change at any time.** Subscript wraps the composer's
  editor transaction dispatch and depends on its internal ownership structure
  and input-rule metadata. Changes to the site, browser, or other extensions
  may break protection or editing without notice. The popup reports whether
  the guard attached; it cannot guarantee that future input rules are covered.
- **No support or maintenance commitment.** No response time, fixes, updates,
  ongoing development, or suitability for continued use is promised. You may
  need to disable, remove, or modify the extension yourself.
- **Unsigned development build.** This repository is not a Mozilla Add-ons
  approval or certification. Disabling signature enforcement permits other
  unsigned extensions in that profile too. Standard Firefox's temporary
  installation remains available without changing its signature setting.
- **No affiliation or endorsement.** This is an independent personal project,
  not an official OpenAI, ChatGPT, Mozilla, or Firefox product. Those names
  identify compatibility and development context only.
- **Privacy statements describe this source version.** Subscript contains no
  telemetry or network requests. It does not make ChatGPT, Firefox, other
  extensions, or modified copies private. Verify the copy you install.

## Intended behaviour

For example, typing `_alpha_ ` retains the underscores and ordinary text;
typing `*alpha* ` still produces italics. Mathematical text such as `x_i x_j`
is preserved. It adds no escape characters, invisible characters, or substitute
underscores. Ordinary underscore bold remains available; a combined underscore
bold/italic conversion is rejected because it includes italicisation.

## Installation

Build with `python3 scripts/package.py` from this directory, or download the
[packaged unsigned XPI](dist/subscript-0.1.0-unsigned.xpi). Firefox desktop 142
or later is required.

In regular Firefox, open `about:debugging#/runtime/this-firefox`, choose **Load
Temporary Add-on…**, and select the XPI. This lasts until Firefox restarts.
Reload ChatGPT tabs after installation, update, or removal.

For persistent unsigned installation, use Firefox Developer Edition and its
separate profile, configured for unsigned add-ons as described in
[Still's installation instructions](https://github.com/emilioferrucci/still#permanent-installation-and-public-release).
Open `about:addons`, then its gear menu → **Install Add-on From File…** and
select the XPI. Normal Firefox requires Mozilla signing for a persistent install.
No Mozilla signing request or Add-ons listing has been submitted.

Subscript is always enabled while installed. Its toolbar popup reports whether
it has attached to the current composer. If it reports that protection is
unavailable, reload ChatGPT. A continuing failure means compatibility needs an
update. Removing the extension requires a page reload to remove page-world code.

## How it works

A script runs at document start in ChatGPT's page world. It finds the composer's
ProseMirror view through the owning React component's `composerController`
property and wraps that view's transaction dispatch method. When an input-rule
transaction both removes surrounding underscores and adds an italic mark, it
instead applies the exact original keystroke to the original editor state.
This stops the destructive conversion before it reaches the editor state or DOM.

It leaves other formatting, editing, history, selection and clipboard handlers
with the editor. Because the wrapper remains on the view, it can also handle
delayed composition-end input-rule transactions. A mutation observer and capture
listeners attach to replacement editors as navigation changes the page.

Subscript changes no scrolling APIs, styles, focus methods, keyboard shortcuts,
network requests or Still settings. It does not modify sent-message rendering
or assistant answers. It does not strip manually applied or already existing
italics; the target is automatic underscore conversion in the composer.

## Privacy and limitations

Host access is limited to `https://chatgpt.com/*`. There are no runtime network
calls, external services, telemetry, storage permissions, or persisted prompt
contents. Source text is inspected only in memory to classify an editor edit.
The isolated status script returns only composer attachment states to the popup.

This is experimental, agent-written software, provided under the MIT license
without warranty. It depends on ChatGPT's current editor structure and input-rule
metadata. ChatGPT can change those internals; neither current tests nor this
implementation constitute a guarantee across all future versions or all input
methods. See [TESTING.md](TESTING.md) for observed coverage and remaining limitations.
See [PRIVACY.md](PRIVACY.md) for the privacy statement.

## Development checks

The extension has no runtime dependencies and no JavaScript compilation step.
The transaction tests use the real `prosemirror-model`, `prosemirror-state` and
`prosemirror-history` npm packages; the DOM ownership shell is a fixture.
With those installed in a development dependency directory:

```sh
NODE_PATH=/path/to/development/node_modules node --test tests/transactions.cjs
web-ext lint --source-dir extension --no-config-discovery
python3 scripts/package.py
```

The XPI includes only `extension/` and the license. It contains no private chat
URLs, screenshots or test prompts. All test conversations must be retained.

Copyright © 2026 Emilio Ferrucci. [MIT license](LICENSE).
