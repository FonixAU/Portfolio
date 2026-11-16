import type { Body } from './bodies';

// Every technology and practice the owner has experience in, from the old site's honeycomb, its job pages and the résumé.
// Each group is one constellation on the 3D map. Tags used in entries are merged in automatically, so an agent adding
// work never has to touch this file; add a name here only for experience that has no entry yet. Spell names as entries do.
export const SKILL_GROUPS: Record<string, string[]> = {
  'Cloud & hosting': ['AWS', 'Azure', 'Google Cloud', 'VMware', 'Vercel', 'Firebase', 'Heroku', 'Fly.io', 'Render'],
  'Infrastructure & identity': ['Terraform', 'Ansible', 'Docker', 'PowerShell', 'Active Directory', 'Entra ID', 'NSX', 'Delinea'],
  'Languages': ['TypeScript', 'JavaScript', 'Python', 'C#', 'C++', 'Dart', 'ABAP', 'SQL', 'Jinja', 'HTML', 'CSS'],
  'Frameworks': ['.NET', 'Node.js', 'Express', 'React', 'Next.js', 'Vue.js', 'Flutter', 'Tailwind CSS', 'Bulma', 'IIS Express', 'Handlebars', 'Radix UI', 'Once UI'],
  'Data': ['Snowflake', 'dbt', 'Airflow', 'Fivetran', 'Postgres', 'MongoDB', 'Firestore', 'Power BI', 'DAX', 'Google Sheets', 'Excel'],
  'Enterprise systems': ['SAP EWM', 'SAP ECC', 'ServiceNow', 'WebMethods', 'MTData', 'ITIL', 'Agile', 'Kanban'],
  'APIs & integrations': ['REST APIs', 'Webhooks', 'Postman', 'Swagger', 'Discord', 'OBS', 'Cloudinary', 'Directus'],
  'Build & ship': ['GitHub Actions', 'Bitbucket Pipelines', 'GitLab', 'SourceTree', 'npm', 'pnpm', 'git worktrees', 'pdf-lib'],
  'Games & 3D': ['Unity', 'Unreal Engine', 'Multiplayer', 'Lua', 'three.js'],
  'AI': ['Ollama', 'Machine learning'],
  'Design': ['Figma', 'Adobe XD', 'Photoshop', 'Wix'],
};

// Where a skill was used when no entry lists it in its (five-tag) stack. From the old site's job pages and the résumé;
// lines marked "assumed" are inferred and are for the owner to confirm. C++, C# and Python come from Deakin's stack.
export const SKILL_SOURCES: Record<string, string[]> = {
  'SAP EWM': ['linfox/graduate'], 'SAP ECC': ['linfox/graduate'], 'MTData': ['linfox/graduate'], 'WebMethods': ['linfox/graduate'],
  'ServiceNow': ['linfox'], 'ITIL': ['linfox/graduate'], 'Power BI': ['linfox/graduate'], 'DAX': ['linfox/graduate'],
  'Fivetran': ['linfox/graduate'], 'Jinja': ['linfox/graduate'], 'SQL': ['linfox/graduate', 'diverse-tech-lab'], 'ABAP': ['linfox/graduate'],
  'Postman': ['linfox/graduate'], 'Docker': ['linfox/graduate'],
  'Active Directory': ['linfox/cloud-platform'], 'Entra ID': ['linfox/cloud-platform'], 'NSX': ['linfox/cloud-platform'], 'Delinea': ['linfox/cloud-platform'],
  'Adobe XD': ['diverse-tech-lab'], 'Bulma': ['diverse-tech-lab'],
  'Heroku': ['nominate-bot'], // the old site's Nominate page
  'Agile': ['linfox'], 'Kanban': ['linfox'], // confirmed by the owner
  'Swagger': ['diverse-tech-lab'], // confirmed by the owner
  'GitHub Actions': ['portfolio'], // this site's CI
  'Excel': ['linfox/graduate'], // assumed: résumé's "Excel macros & scripts" beside on-site financial planning
  // Résumé skills with no named job or project: credited to the degree, for the owner to correct
  'Google Cloud': ['deakin'], 'Tailwind CSS': ['deakin'], 'MongoDB': ['deakin'], 'GitLab': ['deakin'], 'Bitbucket Pipelines': ['deakin'],
  'SourceTree': ['deakin'], 'IIS Express': ['deakin'], 'Figma': ['deakin'], 'Photoshop': ['deakin'], 'Wix': ['deakin'],
};

export type Skill = { name: string; group: string; used: Body[] };

/** All skills, grouped, each with the entries that use it. Entry tags not listed above land in "Also". */
export function skills(bodies: Body[]): Skill[] {
  for (const [n, ids] of Object.entries(SKILL_SOURCES)) for (const id of ids) if (!bodies.some((b) => b.id === id)) throw new Error(`skills.ts: "${n}" points at missing entry "${id}"`);
  const used = (n: string) => bodies.filter((b) => b.stack.includes(n) || SKILL_SOURCES[n]?.includes(b.id));
  const listed = Object.entries(SKILL_GROUPS).flatMap(([group, names]) => names.map((name) => ({ name, group, used: used(name) })));
  const known = new Set(listed.map((s) => s.name));
  const extra = [...new Set(bodies.flatMap((b) => b.stack))].filter((n) => !known.has(n)).sort().map((name) => ({ name, group: 'Also', used: used(name) }));
  return [...listed, ...extra];
}
