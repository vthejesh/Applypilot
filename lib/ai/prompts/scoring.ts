export const SCORING_SYSTEM_PROMPT = `You are a job-resume match analyzer. Return precise JSON only.`;

export function buildScoringPrompt(
  jobTitle: string,
  requiredSkills: string[],
  niceToHaveSkills: string[],
  experienceLevel: string | null,
  jobDescription: string,
  userSkills: string[],
  userExperience: string,
  userProjects: string
): string {
  return `Analyze how well this applicant matches the job.

JOB:
- Title: ${jobTitle}
- Required skills: ${requiredSkills.join(', ')}
- Nice to have: ${niceToHaveSkills.join(', ')}
- Experience level: ${experienceLevel ?? 'Not specified'}
- Description: ${jobDescription.slice(0, 1500)}

APPLICANT:
- Skills: ${userSkills.join(', ')}
- Experience: ${userExperience.slice(0, 500)}
- Projects: ${userProjects.slice(0, 500)}

Return this JSON:
{
  "overallScore": 78,
  "matchedSkills": ["React", "TypeScript"],
  "missingRequiredSkills": ["GraphQL"],
  "missingNiceToHaveSkills": ["Docker"],
  "bonusSkills": ["Skills applicant has that weren't asked for but are relevant"],
  "scoreBreakdown": {
    "requiredSkills": 40,
    "niceToHave": 8,
    "experienceLevel": 15,
    "projectRelevance": 10,
    "overall": 5
  },
  "maxScoreBreakdown": {
    "requiredSkills": 50,
    "niceToHave": 15,
    "experienceLevel": 20,
    "projectRelevance": 10,
    "overall": 5
  },
  "reason": "Short explanation of why this score",
  "recommendation": "apply|borderline|skip",
  "warningMessage": "Warning if score is low or null",
  "skillGaps": [
    { "skill": "GraphQL", "priority": "high|medium|low", "learningHint": "Free course at howtographql.com" }
  ],
  "redFlags": []
}`;
}

export function buildScamDetectionPrompt(jobText: string): string {
  return `Analyze this job post for potential scam indicators.

JOB POST:
${jobText.slice(0, 3000)}

Return this JSON:
{
  "isLikelyScam": false,
  "scamScore": 0.1,
  "flags": [
    { "flag": "Asks for registration fee", "severity": "high", "found": false },
    { "flag": "Vague company details", "severity": "medium", "found": false },
    { "flag": "Too-good-to-be-true salary", "severity": "medium", "found": false },
    { "flag": "Free email domain for large company", "severity": "medium", "found": false },
    { "flag": "Unpaid position disguised as paid", "severity": "high", "found": false },
    { "flag": "Asks for personal info upfront", "severity": "high", "found": false },
    { "flag": "No company website or verifiable info", "severity": "medium", "found": false },
    { "flag": "Poor grammar or spelling", "severity": "low", "found": false }
  ],
  "verdict": "safe|warning|likely_scam",
  "reason": "This job post appears legitimate because..."
}`;
}
