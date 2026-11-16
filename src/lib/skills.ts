import type { Body } from './bodies';

// Every technology and practice the owner has experience in, from the old site's honeycomb and the résumé.
// Tags used in entries are merged in automatically, so an agent adding work never has to touch this file;
// add a name here only for experience that has no entry yet. Spell names exactly as entries do.
export const SKILL_GROUPS: Record<string, string[]> = {
  'Cloud & hosting': ['AWS', 'Azure', 'Google Cloud', 'VMware', 'Vercel', 'Firebase', 'Heroku', 'Fly.io', 'Render'],
  'Infrastructure & identity': ['Terraform', 'Ansible', 'Docker', 'PowerShell', 'Active Directory', 'Entra ID', 'NSX', 'Delinea'],
  'Languages & frameworks': ['TypeScript', 'JavaScript', 'Python', 'C#', 'C++', '.NET', 'Node.js', 'Express', 'React', 'Next.js', 'Vue.js', 'Flutter', 'Dart', 'ABAP', 'HTML', 'CSS', 'Tailwind CSS', 'Bulma'],
  'Data': ['Snowflake', 'dbt', 'Airflow', 'Fivetran', 'Postgres', 'MongoDB', 'Firestore', 'SQL', 'Power BI', 'DAX'],
  'Delivery & operations': ['GitHub Actions', 'Bitbucket Pipelines', 'GitLab', 'ServiceNow', 'SAP EWM', 'Postman', 'Swagger', 'REST APIs', 'ITIL', 'Agile', 'Kanban'],
  'Design': ['Figma', 'Adobe XD', 'Photoshop'],
};

export type Skill = { name: string; group: string; used: Body[] };

/** All skills, grouped, each with the entries that use it. Entry tags not listed above land in "Also". */
export function skills(bodies: Body[]): Skill[] {
  const used = (n: string) => bodies.filter((b) => b.stack.includes(n));
  const listed = Object.entries(SKILL_GROUPS).flatMap(([group, names]) => names.map((name) => ({ name, group, used: used(name) })));
  const known = new Set(listed.map((s) => s.name));
  const extra = [...new Set(bodies.flatMap((b) => b.stack))].filter((n) => !known.has(n)).sort().map((name) => ({ name, group: 'Also', used: used(name) }));
  return [...listed, ...extra];
}
