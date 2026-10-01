export const RESUME_SYSTEM_PROMPT = `You are a resume optimization expert and ATS specialist.

CRITICAL RULES:
1. Return ONLY valid JSON.
2. NEVER invent skills, experience, companies, projects, grades, or any other information.
3. You may ONLY reorder, rephrase, or emphasize information already present in the resume.
4. When tailoring, every bullet point must be verifiable from the original resume text.
5. Flag any request that would require you to add false information.`;

export function buildResumePickPrompt(
  jobTitle: string,
  requiredSkills: string[],
  resumes: Array<{ id: string; roleTag: string; summary: string; skills: string[] }>
): string {
  return `Pick the best resume for this job and explain why.

JOB: ${jobTitle}
REQUIRED SKILLS: ${requiredSkills.join(', ')}

AVAILABLE RESUMES:
${resumes.map((r, i) => `${i + 1}. ID: ${r.id} | Role: ${r.roleTag} | Skills: ${r.skills.join(', ')} | Summary: ${r.summary}`).join('\n')}

Return this JSON:
{
  "selectedResumeId": "resume-id-here",
  "matchScore": 85,
  "reason": "This resume was selected because...",
  "matchedSkills": ["React", "TypeScript"],
  "missingSkills": ["GraphQL"],
  "confidence": 0.9
}`;
}

export function buildResumeTailorPrompt(
  jobTitle: string,
  company: string,
  requiredSkills: string[],
  jobDescription: string,
  resumeData: {
    summary: string;
    skills: string[];
    experience: string;
    projects: string;
    education: string;
  }
): string {
  return `Tailor this resume for the job below. You may ONLY use information already in the resume.

JOB: ${jobTitle} at ${company}
REQUIRED SKILLS: ${requiredSkills.join(', ')}
JOB DESCRIPTION: ${jobDescription.slice(0, 1000)}

ORIGINAL RESUME:
Summary: ${resumeData.summary}
Skills: ${resumeData.skills.join(', ')}
Experience: ${resumeData.experience}
Projects: ${resumeData.projects}
Education: ${resumeData.education}

RETURN THIS JSON:
{
  "tailoredSummary": "Rewritten summary using ONLY original content, emphasizing relevance to this job",
  "reorderedSkills": ["Most relevant skills first"],
  "changes": [
    {
      "field": "summary",
      "original": "Original text",
      "tailored": "New text",
      "reason": "Why this change helps"
    }
  ],
  "atsScore": 78,
  "atsSuggestions": ["Add keyword X", "Move skills section up"]
}`;
}

export function buildResumeParsePrompt(resumeText: string): string {
  return `Parse this resume text into structured JSON. Extract exactly what is written - do not add, infer, or modify any information.

RESUME TEXT:
${resumeText.slice(0, 8000)}

Return this JSON:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "+1234567890",
  "linkedin": "URL or null",
  "github": "URL or null",
  "portfolio": "URL or null",
  "location": "City, Country",
  "summary": "Professional summary text",
  "skills": ["Skill1", "Skill2"],
  "skillCategories": {
    "languages": ["Python", "JavaScript"],
    "frameworks": ["React", "Django"],
    "tools": ["Git", "Docker"],
    "databases": ["PostgreSQL"],
    "other": []
  },
  "experience": [
    {
      "company": "Company Name",
      "title": "Role Title",
      "startDate": "Jan 2023",
      "endDate": "Present",
      "location": "City",
      "bullets": ["Achievement 1", "Achievement 2"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "What it does",
      "technologies": ["React", "Node.js"],
      "link": "URL or null"
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "B.Tech Computer Science",
      "year": "2024",
      "gpa": "8.5/10 or null"
    }
  ],
  "certifications": ["Cert 1", "Cert 2"],
  "languages": ["English (Fluent)", "Hindi (Native)"]
}`;
}

export function buildAtsScorePrompt(resumeText: string, jobDescription?: string): string {
  return `Score this resume for ATS compatibility and provide actionable fixes.

RESUME:
${resumeText.slice(0, 6000)}
${jobDescription ? `\nJOB DESCRIPTION (for keyword matching):\n${jobDescription.slice(0, 2000)}` : ''}

Return this JSON:
{
  "score": 75,
  "breakdown": {
    "formatting": 20,
    "keywords": 25,
    "sections": 18,
    "readability": 12
  },
  "maxBreakdown": {
    "formatting": 25,
    "keywords": 35,
    "sections": 25,
    "readability": 15
  },
  "issues": [
    { "severity": "high|medium|low", "field": "section", "message": "Missing work experience section", "fix": "Add an Experience section" }
  ],
  "missingKeywords": ["React", "TypeScript"],
  "presentKeywords": ["Python", "SQL"]
}`;
}
