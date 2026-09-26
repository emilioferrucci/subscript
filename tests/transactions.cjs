/* SPDX-License-Identifier: MIT */
// Real ProseMirror documents, transactions, selections and undo history;
// only the page/React discovery shell is a fixture. No ChatGPT data is used.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const {Schema} = require('prosemirror-model');
const {EditorState, TextSelection} = require('prosemirror-state');
const {history, undo, redo} = require('prosemirror-history');
const source = readFileSync(require('node:path').join(__dirname, '../extension/guard.js'), 'utf8');
const schema = new Schema({
  nodes: {doc: {content: 'paragraph+'}, paragraph: {content: 'text*'}, text: {}},
  marks: {em: {}, strong: {}}
});

function fixture(text = '') {
  class Element {
    dataset = {};
    closest() { return this; }
  }
  const element = new Element();
  const view = {
    dom: element,
    state: EditorState.create({schema,
      doc: schema.node('doc', null, [schema.node('paragraph', null, text ? schema.text(text) : null)]),
      plugins: [history()]}),
    dispatch(tr) { this.state = this.state.apply(tr); }
  };
  view.state = view.state.apply(view.state.tr.setSelection(TextSelection.atEnd(view.state.doc)));
  element.parentElement = {__reactFiber$fixture: {memoizedProps: {composerController: {view}}}};
  const events = {};
  let observer;
  const elements = [element];
  const context = vm.createContext({window: {}, Element,
    document: {querySelectorAll: () => elements, addEventListener: (name, fn) => { events[name] = fn; }},
    MutationObserver: class {constructor(fn) {observer = fn;} observe() {}}
  });
  vm.runInContext(source, context);
  return {view, element, context, events, elements, scan: () => observer()};
}

function convert(view, raw, inner, marks = ['em'], input = ' ', from = raw.length + 1, to = from) {
  const tr = view.state.tr.replaceWith(1, raw.length + 1, schema.text(inner));
  for (const mark of marks) tr.addMark(1, inner.length + 1, schema.marks[mark].create());
  if (input) tr.insertText(input, inner.length + 1);
  tr.setMeta('inputRuleFixture', {transform: tr, from, to, text: input});
  view.dispatch(tr);
}

for (const text of ['_alpha_', '_multi_word_', '_x_i + x_j_', '_café α_', '_a'.padEnd(450, 'x') + '_']) {
  test(`literal underscores: ${text.slice(0, 28)}`, () => {
    const {view, element} = fixture(text);
    convert(view, text, text.slice(1, -1));
    assert.equal(view.state.doc.textContent, text + ' ');
    assert.equal(view.state.doc.firstChild.firstChild.marks.length, 0);
    assert.equal(view.state.selection.from, text.length + 2);
    assert.equal(element.dataset.subscriptState, 'active');
  });
}
test('asterisk italics with internal underscores are preserved', () => {
  const {view} = fixture('*a_b*');
  convert(view, '*a_b*', 'a_b');
  assert.equal(view.state.doc.textContent, 'a_b ');
  assert.equal(view.state.doc.firstChild.firstChild.marks[0].type.name, 'em');
});
test('underscore bold remains available', () => {
  const {view} = fixture('__bold__');
  convert(view, '__bold__', 'bold', ['strong']);
  assert.equal(view.state.doc.textContent, 'bold ');
  assert.equal(view.state.doc.firstChild.firstChild.marks[0].type.name, 'strong');
});
test('combined underscore bold/italic conversion stays literal', () => {
  const {view} = fixture('___both___');
  convert(view, '___both___', 'both', ['em', 'strong']);
  assert.equal(view.state.doc.textContent, '___both___ ');
});
test('composition-end rule with empty triggering text stays literal', () => {
  const {view} = fixture('_composition_');
  convert(view, '_composition_', 'composition', ['em'], '');
  assert.equal(view.state.doc.textContent, '_composition_');
});
test('selection replacement uses original input range', () => {
  const {view} = fixture('_word_X');
  convert(view, '_word_', 'word', ['em'], ' ', 7, 8);
  assert.equal(view.state.doc.textContent, '_word_ ');
});
test('manual italic formatting is unchanged', () => {
  const {view} = fixture('_manual_');
  view.dispatch(view.state.tr.addMark(1, 9, schema.marks.em.create()));
  assert.equal(view.state.doc.textContent, '_manual_');
  assert.equal(view.state.doc.firstChild.firstChild.marks[0].type.name, 'em');
});
test('undo/redo restores literal text without reapplying the rejected mark', () => {
  const {view} = fixture('_history_');
  convert(view, '_history_', 'history');
  assert.ok(undo(view.state, tr => view.dispatch(tr)));
  assert.equal(view.state.doc.textContent, '_history_');
  assert.ok(redo(view.state, tr => view.dispatch(tr)));
  assert.equal(view.state.doc.textContent, '_history_ ');
  assert.equal(view.state.doc.firstChild.firstChild.marks.length, 0);
});
test('scanning and repeated injection do not stack wrappers', () => {
  const f = fixture('_once_');
  const dispatch = f.view.dispatch;
  f.scan();
  vm.runInContext(source, f.context);
  assert.equal(f.view.dispatch, dispatch);
  convert(f.view, '_once_', 'once');
  assert.equal(f.view.state.doc.textContent, '_once_ ');
});
test('view replacement on the same editor node is protected before typing', () => {
  const f = fixture('_old_');
  f.view.isDestroyed = true;
  const replacement = {
    dom: f.element,
    state: EditorState.create({schema, doc: schema.node('doc', null,
      [schema.node('paragraph', null, schema.text('_new_'))])}),
    dispatch(tr) {this.state = this.state.apply(tr);}
  };
  f.element.parentElement.__reactFiber$fixture.memoizedProps.composerController.view = replacement;
  f.events.beforeinput({target: f.element});
  convert(replacement, '_new_', 'new');
  assert.equal(replacement.state.doc.textContent, '_new_ ');
});
test('unknown editor exposes unavailable status rather than a false success', () => {
  const f = fixture();
  const unknown = {dataset: {}};
  f.elements.push(unknown);
  f.scan();
  assert.equal(unknown.dataset.subscriptState, 'unavailable');
});
