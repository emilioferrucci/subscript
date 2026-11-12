# Subscript 0.1.0 verification

## Unlisted signing preparation, 26 October 2026

Rebuilt version 0.1.0 and verified that all seven XPI entries exactly match
the extension source and license. JavaScript syntax checks passed. Mozilla
`web-ext` 10.7.0 reported zero errors, warnings, and notices; its optional
update checker could not write its configuration, but validation completed.
The unsigned XPI's SHA-256 remains
`524b3f55bbe0ef936d5fbe307c86c90c99d36906cfd8e25ea194600c3c9b0ba1`.
These are package checks; the browser and transaction tests below were not
rerun. Signing is a separate step and is not established by these checks.

## Earlier behavior verification

Tested on macOS on 26 September 2026. Development and the main live tests used
regular Firefox 156.0.1. Firefox Developer Edition 157.0 received the completed
package afterward, followed by an installation smoke test. Still 0.1.5 was
enabled alongside Subscript in both browsers.

## Feasibility observation

Before implementation, native typing in regular Firefox reproduced the issue:
typing `_typedprobe_` and a following space removed the underscores and inserted
an actual `em` mark. This happened before sending. The editor's input-rule
transaction contained both the transformation and the original triggering edit.
Subscript can therefore prevent the conversion by applying only that edit to
the original editor state, retaining the literal underscores.

## Live regular Firefox tests

Still was reinstalled as a temporary add-on before compatibility testing.
Subscript was loaded as a temporary packaged add-on. Cases were entered through
native typing, including the trailing space that triggers conversion; the paste
case was separate. The editor DOM was inspected to distinguish literal text
from actual formatting marks.

| Input | Observed result |
| --- | --- |
| `_alpha_ ` | Literal underscores; no automatic italics |
| `*beta* ` | Italics retained |
| `x_i x_j ` | Literal text retained |
| `_multi_word_ ` | Literal underscores retained |
| `*star_with_underscores* ` | Asterisk italics retained |
| `_x_i + x_j_ ` | Literal underscores retained |
| `__bold__ ` | Bold retained |
| `___triple___ ` | Literal; combined underscore bold/italic conversion blocked |
| `_outer *inner* tail_ ` | Outer underscores literal; inner asterisk italics retained |
| Paste `_pasteend_`, then type a space | Native literal-paste span retained |
| New line: `_newline_ *newline_star* ` | Underscores literal; asterisk italics retained |
| Undo, then redo the last typed segment | Literal text restored, inner italics retained |

A test prompt was sent and its conversation retained. After reloading the final
package and saved conversation, `_after_reload_ *still_italic* ` again passed.
The extension popup reported that protection was attached.

With both extensions active during response generation, 29 samples over about
15 seconds held scrollTop at 0 while scrollHeight grew from 2022 to 2514.
Programmatic scrollTo and scrollTop assignment remained blocked. Native manual
scrolling moved the position from 0 to 90, and the page's bottom button reached
the bottom (2017.35, versus an integer maximum of 2017).

## Developer Edition installation check

The final unsigned XPI was installed through Firefox's normal file installer,
using the profile's existing unsigned-add-on configuration used for Still.
The add-on manager confirmed Subscript 0.1.0 and Still 0.1.5 enabled.
No browser security preferences were changed for this installation.

A fresh ChatGPT tab received native typing of the underscore, asterisk,
internal-underscore, mathematical, triple-underscore and nested cases above.
The resulting DOM contained literal underscores and `em` only for `beta`,
`star_with_underscores`, and `inner`. The composer status was `active`, both
extension installation markers were present, and the popup reported protection
attached. The test draft was left intact. No chats were deleted in either browser.

## Automated checks

- 15 transaction tests passed using real ProseMirror model, state and history
  packages, with a fixture for the DOM/React ownership lookup.
- Coverage includes Unicode, long text, asterisk and manual formatting,
  underscore bold, combined bold/italic, selection replacement, composition-end
  transaction shape, undo/redo, duplicate injection, editor replacement and
  unavailable editor reporting.
- Final `web-ext lint`: 0 errors, 0 warnings, 0 notices. Its optional update check
  could not write the local configuration store; extension validation completed.
- Package SHA-256:
  `524b3f55bbe0ef936d5fbe307c86c90c99d36906cfd8e25ea194600c3c9b0ba1`.

Development dependencies used: prosemirror-model 1.25.12, prosemirror-state
1.4.4, prosemirror-transform 1.12.2, prosemirror-history 1.5.0, web-ext 10.7.0.

## Limits of this evidence

Real IME, dictation, mobile keyboards, all historical ChatGPT editor variants,
and every possible input sequence were not tested end to end. The composition
test verifies a transaction shape, not a native IME session. Developer Edition
was not restarted to test persistence; it used the persistent add-on installer,
not the temporary debugging loader.

The guard depends on ChatGPT's current editor ownership and input-rule metadata.
Future site changes can require an update. Passing these checks does not justify
a promise of exception-free operation across all future versions and input
methods. Existing or manually applied italics and rendered sent messages are
outside the automatic underscore-conversion behaviour being blocked.
