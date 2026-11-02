import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface Resume {
  basics: {
    name: string;
    label?: string;
    email?: string;
    url?: string;
    summary?: string;
    location?: { city?: string; region?: string; countryCode?: string };
    profiles?: { network: string; url: string }[];
  };
  work: {
    name: string;
    position: string;
    url?: string;
    startDate: string;
    endDate?: string;
    summary?: string;
    location?: string;
  }[];
  education: {
    institution: string;
    area?: string;
    studyType?: string;
    startDate: string;
    endDate?: string;
    location?: string;
  }[];
  skills?: { name: string; keywords: string[] }[];
  certificates?: { name: string; date: string; expires?: string }[];
}

function formatDate(dateStr: string): string {
  const [year, month] = dateStr.split('-');
  if (!month) return year;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[parseInt(month) - 1]} ${year}`;
}

function formatDateRange(start: string, end?: string): string {
  const startStr = formatDate(start);
  const endStr = end ? formatDate(end) : 'Present';
  return `${startStr} – ${endStr}`;
}

function convertToMarkdown(resume: Resume): string {
  const lines: string[] = [];
  
  lines.push(`# ${resume.basics.name}`);
  lines.push('');
  
  const contactParts: string[] = [];
  if (resume.basics.email) contactParts.push(resume.basics.email);
  if (resume.basics.url) contactParts.push(resume.basics.url);
  if (resume.basics.location) {
    const loc = [resume.basics.location.city, resume.basics.location.region, resume.basics.location.countryCode].filter(Boolean).join(', ');
    if (loc) contactParts.push(loc);
  }
  if (contactParts.length > 0) {
    lines.push(contactParts.join(' \\textbar '));
  }
  lines.push('');
  
  if (resume.basics.summary) {
    lines.push(`## Summary`);
    lines.push('');
    lines.push(resume.basics.summary);
    lines.push('');
  }
  
  if (resume.education && resume.education.length > 0) {
    lines.push(`## Education`);
    lines.push('');
    for (const edu of resume.education) {
      const degree = edu.studyType && edu.area 
        ? `${edu.studyType} in ${edu.area}`
        : edu.studyType || edu.area || edu.institution;
      lines.push(`**${degree}**  `);
      lines.push(`*${edu.institution}*${edu.location ? `, ${edu.location}` : ''}  `);
      lines.push(`_${formatDateRange(edu.startDate, edu.endDate)}_  `);
      lines.push('');
    }
  }
  
  if (resume.work && resume.work.length > 0) {
    lines.push(`## Professional Experience`);
    lines.push('');
    for (const job of resume.work) {
      lines.push(`**${job.position}**  `);
      lines.push(`*${job.name}*${job.location ? `, ${job.location}` : ''}  `);
      lines.push(`_${formatDateRange(job.startDate, job.endDate)}_  `);
      if (job.summary) {
        lines.push('');
        lines.push(job.summary);
      }
      lines.push('');
    }
  }
  
  if (resume.skills && resume.skills.length > 0) {
    lines.push(`## Skills`);
    lines.push('');
    for (const skill of resume.skills) {
      lines.push(`**${skill.name}:** ${skill.keywords.join(', ')}  `);
    }
    lines.push('');
  }
  
  if (resume.certificates && resume.certificates.length > 0) {
    lines.push(`## Certifications`);
    lines.push('');
    for (const cert of resume.certificates) {
      lines.push(`**${cert.name}**  `);
      lines.push(`_${formatDate(cert.date)}_${cert.expires ? ` – Expires: ${formatDate(cert.expires)}` : ''}  `);
    }
    lines.push('');
  }
  
  return lines.join('\n');
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

async function main() {
  const username = 'DiegoBarrosA';
  const apiUrl = `https://registry.jsonresume.org/${username}.json`;
  
  console.log(`Fetching resume from ${apiUrl}...`);
  const resume: Resume = await fetchJson(apiUrl);
  if (!resume || typeof resume.basics !== "object" || !resume.basics) {
    throw new Error("Payload has no basics object; refusing to write files");
  }
  
  const jsonPath = path.resolve('public/resume.json');
  fs.writeFileSync(jsonPath, JSON.stringify(resume, null, 2));
  console.log(`Saved resume.json`);
  
  const markdown = convertToMarkdown(resume);
  fs.writeFileSync(path.resolve('resume.md'), markdown);
  console.log(`Converted to resume.md`);
  
  const pdfPath = path.resolve('public/resume.pdf');
  execSync(`pandoc resume.md -o ${pdfPath} --template=templates/apa-resume.tex -s`, { stdio: 'inherit' });
  console.log(`Generated resume.pdf`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
