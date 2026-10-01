export const EMAIL_SYSTEM_PROMPT = `You are an expert job application email writer helping students and freshers land their first jobs.

CRITICAL RULES:
1. Return ONLY valid JSON - no markdown, no explanation.
2. Write emails that sound human, warm, and genuine - NOT robotic or templated.
3. Use ONLY information provided to you. Never invent skills, projects, companies, or experience.
4. Keep emails concise: 150-250 words for friendly/short, 200-350 for formal.
5. For freshers with no work experience: highlight projects, GitHub, certifications, and learning.
6. The email must pass basic grammar and spell check.
7. Generate exactly 3 distinct subject line options.`;

export interface EmailPromptParams {
  jobTitle: string;
  company: string;
  recruiterName?: string;
  requiredSkills: string[];
  jobDescription?: string;
  instructions?: string;
  resumeSummary: string;
  resumeSkills: string[];
  resumeProjects?: string;
  resumeExperience?: string;
  userName: string;
  userPhone?: string;
  userLinkedin?: string;
  userGithub?: string;
  userPortfolio?: string;
  style: 'formal' | 'friendly' | 'short' | 'referral' | 'career-switch';
  tone: 'professional' | 'friendly' | 'casual' | 'enthusiastic';
  targetLength: 'short' | 'medium' | 'long';
  isFresher: boolean;
  referralName?: string;
  customInstructions?: string;
}

export function buildEmailPrompt(params: EmailPromptParams): string {
  const lengthGuide = {
    short: '100-150 words',
    medium: '150-250 words',
    long: '250-350 words',
  }[params.targetLength];

  const fresherNote = params.isFresher
    ? 'The applicant is a fresher with no professional work experience. Focus on projects, skills, certifications, and learning enthusiasm.'
    : 'The applicant has work experience. Highlight relevant experience and achievements.';

  const matchedSkills = params.resumeSkills.filter((s) =>
    params.requiredSkills.some((r) => r.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(r.toLowerCase()))
  );

  return `Write a job application email with these details:

JOB DETAILS:
- Title: ${params.jobTitle}
- Company: ${params.company}
- Recruiter name: ${params.recruiterName ?? 'Hiring Manager'}
- Required skills: ${params.requiredSkills.join(', ')}
- Special instructions: ${params.instructions ?? 'None'}
${params.jobDescription ? `- Job description excerpt: ${params.jobDescription.slice(0, 500)}` : ''}

APPLICANT DETAILS (use ONLY this information, never invent anything):
- Name: ${params.userName}
- Phone: ${params.userPhone ?? 'Not provided'}
- LinkedIn: ${params.userLinkedin ?? 'Not provided'}
- GitHub: ${params.userGithub ?? 'Not provided'}
- Portfolio: ${params.userPortfolio ?? 'Not provided'}
- Resume summary: ${params.resumeSummary}
- Skills: ${params.resumeSkills.join(', ')}
- Skills matching job: ${matchedSkills.join(', ') || 'General technical skills'}
${params.resumeProjects ? `- Projects: ${params.resumeProjects.slice(0, 400)}` : ''}
${params.resumeExperience ? `- Experience: ${params.resumeExperience.slice(0, 400)}` : ''}
${params.referralName ? `- Referred by: ${params.referralName}` : ''}

STYLE: ${params.style} | TONE: ${params.tone} | LENGTH: ${lengthGuide}
${fresherNote}
${params.customInstructions ? `CUSTOM INSTRUCTIONS: ${params.customInstructions}` : ''}

Return this exact JSON:
{
  "subject": [
    "Subject Option 1",
    "Subject Option 2",
    "Subject Option 3"
  ],
  "body": "The full email body text",
  "signature": "Best,\n${params.userName}\n${params.userPhone ?? ''}\n${params.userLinkedin ?? ''}",
  "wordCount": 185,
  "tone": "friendly",
  "keyPoints": ["Point highlighted 1", "Point highlighted 2"]
}`;
}
