import projectsJson from '../data/projects.json';
import profileJson from '../data/profile.json';
import type { Lang } from '../i18n/ui';

type Bi = { en: string; vi: string };
export interface Project {
  slug: string; order: number; kind: string; featured?: boolean; confidential?: boolean;
  title: Bi; tagline: Bi; role: Bi; period: { start: string; end: string };
  repo: string | null; tags: string[]; stack: string[];
  metrics: { value: string; label: Bi; source?: string }[]; bullets: { en: string[]; vi: string[] };
  // case study (không bắt buộc): vấn đề → cách làm → đánh giá → giới hạn → nếu làm lại
  case?: { problem?: Bi; approach?: Bi; evaluation?: Bi; limits?: { en: string[]; vi: string[] }; next?: Bi };
  flow?: { label: Bi; note: Bi }[];                                   // sơ đồ luồng xử lý
  gallery?: { src: string; w: number; h: number; alt: Bi; caption: Bi }[];   // ảnh chụp màn hình thật
}
export const projects = projectsJson as unknown as Project[];
export const profile = profileJson as any;

export const tr = (b: Bi | undefined, lang: Lang) => (b ? b[lang] ?? b.en : '');

const MONTHS = { en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], vi: [] as string[] };
export function period(p: Project['period'], lang: Lang) {
  const f = (s: string) => { const [y, m] = s.split('-'); return lang === 'vi' ? `${m}/${y}` : `${MONTHS.en[+m - 1]} ${y}`; };
  return p.start === p.end ? f(p.start) : `${f(p.start)} – ${f(p.end)}`;
}

// Logo thật cho tên công nghệ (file trong public/icons). Không có logo → chỉ hiện chữ.
const ICONS: [RegExp, string][] = [
  [/python/i, 'python'], [/pytorch/i, 'pytorch'], [/hugging|transformers|phobert|qwen/i, 'hugging-face'], [/langgraph|langchain/i, 'langchain'],
  [/gemini/i, 'gemini'], [/ollama/i, 'ollama'], [/qdrant/i, 'qdrant'], [/postgres|pgvector/i, 'postgres'], [/redis|celery/i, 'redis'],
  [/fastapi/i, 'fastapi'], [/django/i, 'django'], [/docker/i, 'docker'], [/github actions/i, 'github-actions'], [/aws|ecs|ecr/i, 'aws'],
  [/prometheus/i, 'prometheus'], [/grafana/i, 'grafana'], [/supabase/i, 'supabase'], [/react native|expo/i, 'react'], [/next\.js/i, 'nextjs'],
];
export const iconFor = (name: string) => ICONS.find(([re]) => re.test(name))?.[1];
export const INK_ICONS = new Set(['ollama', 'nextjs']);

export const CATEGORIES = ['all', 'llm', 'research', 'data', 'vision'] as const;
export const catLabel: Record<string, Bi> = {
  all: { en: 'All', vi: 'Tất cả' }, llm: { en: 'LLM & Agents', vi: 'LLM & Agent' }, research: { en: 'Research', vi: 'Nghiên cứu' },
  data: { en: 'Data & MLOps', vi: 'Dữ liệu & MLOps' }, vision: { en: 'Vision & ML', vi: 'Thị giác & ML' },
};
export function cats(p: Project) {
  const t = new Set(p.tags); const out = ['all'];
  if (['llm', 'rag', 'agents'].some(x => t.has(x))) out.push('llm');
  if (t.has('research')) out.push('research');
  if (['data-engineer', 'mlops', 'llmops', 'data-analyst'].some(x => t.has(x))) out.push('data');
  if (['computer-vision', 'deep-learning', 'ml-engineer', 'recommender', 'reinforcement-learning'].some(x => t.has(x))) out.push('vision');
  return out;
}
// màu nhấn cho từng dự án (giữ đồng bộ với trang chủ)
const ACC = ['--r-amber', '--r-coral', '--r-cyan', '--r-blue', '#2fd27c'];
export const accentFor = (i: number) => { const a = ACC[i % ACC.length]; return a.startsWith('--') ? `var(${a})` : a; };
