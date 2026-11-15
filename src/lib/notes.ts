// Ghi chú kỹ thuật: src/notes/<slug>.<lang>.md (frontmatter: slug, lang, title, description, date, project, minutes).
import type { Lang } from '../i18n/ui';

export interface NoteMeta { slug: string; lang: Lang; title: string; description: string; date: string; project?: string; minutes?: number }
interface NoteModule { frontmatter: NoteMeta; Content: any }

const mods = import.meta.glob<NoteModule>('../notes/*.md', { eager: true });
export const notes = Object.values(mods)
  .map(m => ({ ...m.frontmatter, date: String(m.frontmatter.date).slice(0, 10), Content: m.Content }))
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)));

export const notesFor = (lang: Lang) => notes.filter(n => n.lang === lang);
export const noteFor = (slug: string, lang: Lang) => notes.find(n => n.slug === slug && n.lang === lang);
export const notesOfProject = (project: string, lang: Lang) => notesFor(lang).filter(n => n.project === project);
export const fmtDate = (d: string, lang: Lang) => {
  const [y, m, day] = d.split('-');
  return lang === 'vi' ? `${day}/${m}/${y}` : new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
};
