// Link plain text before HTML rendering; longest names win and Latin words stay whole.
export function createGlossaryRenderer(ingredients, escapeHtml) {
  const entries = ingredients.flatMap(item => [item.name, ...(item.aliases ?? [])]
    .map(term => ({ term, slug: item.slug }))).sort((a, b) => b.term.length - a.term.length);
  const byTerm = new Map(entries.map(entry => [entry.term, entry.slug]));
  const pattern = new RegExp(entries.map(({ term }) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'gu');
  return (text, seen = new Set()) => {
    let result = '', end = 0;
    for (const match of String(text).matchAll(pattern)) {
      const term = match[0], start = match.index, slug = byTerm.get(term);
      const latin = /[A-Za-z0-9]/;
      if ((latin.test(term[0]) && /[A-Za-z0-9_]/.test(text[start - 1] ?? '')) ||
          (latin.test(term.at(-1)) && /[A-Za-z0-9_]/.test(text[start + term.length] ?? ''))) continue;
      result += escapeHtml(text.slice(end, start));
      result += seen.has(slug) ? escapeHtml(term) : `<a class="glossary-link" href="/ingredients/${escapeHtml(slug)}/">${escapeHtml(term)}</a>`;
      seen.add(slug);
      end = start + term.length;
    }
    return result + escapeHtml(text.slice(end));
  };
}
