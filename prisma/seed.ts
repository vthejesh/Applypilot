import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@applypilot.dev' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@applypilot.dev',
      profile: {
        create: {
          fullName: 'Demo User',
          phone: '+91 9876543210',
          linkedinUrl: 'https://linkedin.com/in/demouser',
          githubUrl: 'https://github.com/demouser',
          location: 'Bangalore, India',
          timezone: 'Asia/Kolkata',
          bio: 'Full-stack developer passionate about building products.',
          targetRoles: ['Software Engineer', 'Frontend Developer', 'Full Stack Developer'],
          targetLocations: ['Bangalore', 'Remote'],
          preferRemote: true,
          experienceLevel: 'fresher',
          skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Python'],
          dailySendLimit: 10,
          onboardingDone: true,
        },
      },
    },
  });

  console.log(`✅ Created user: ${user.email}`);

  // Seed default email templates
  const templates = [
    {
      name: 'Friendly Introduction',
      description: 'Warm, personal email for most jobs',
      style: 'friendly',
      subject: 'Application for {{jobTitle}} at {{company}}',
      body: `Hi {{recruiterName}},

I came across the {{jobTitle}} role at {{company}} and I'm genuinely excited about it — the work you're doing in {{domain}} aligns perfectly with what I want to build.

I'm a {{experienceLevel}} developer with hands-on experience in {{topSkills}}. {{keyHighlight}}

I've attached my resume and would love to discuss how I can contribute to your team.

Looking forward to connecting!

Best,
{{userName}}
{{phone}} | {{linkedinUrl}}`,
      tone: 'friendly',
      isSystem: true,
      isDefault: true,
    },
    {
      name: 'Formal Application',
      description: 'Professional tone for large companies',
      style: 'formal',
      subject: 'Application for the Position of {{jobTitle}} — {{userName}}',
      body: `Dear {{recruiterName}},

I am writing to express my interest in the {{jobTitle}} position at {{company}} as advertised.

With a strong foundation in {{topSkills}}, I believe I am well-positioned to contribute effectively to your team. {{keyHighlight}}

Please find my resume attached for your consideration. I would welcome the opportunity to discuss my application further.

Thank you for your time and consideration.

Sincerely,
{{userName}}
{{phone}} | {{linkedinUrl}}`,
      tone: 'formal',
      isSystem: true,
    },
    {
      name: 'Short & Direct',
      description: 'Brief email for busy recruiters',
      style: 'short',
      subject: '{{jobTitle}} — {{userName}}',
      body: `Hi {{recruiterName}},

I'd love to apply for the {{jobTitle}} role at {{company}}.

Quick summary: {{keyHighlight}} Resume attached.

Happy to chat — {{phone}}

{{userName}}`,
      tone: 'casual',
      isSystem: true,
    },
    {
      name: 'Referral-Style',
      description: 'Mention a mutual connection or referral',
      style: 'referral',
      subject: 'Referred by {{referralName}} — {{jobTitle}} at {{company}}',
      body: `Hi {{recruiterName}},

{{referralName}} suggested I reach out regarding the {{jobTitle}} opening at {{company}}.

I have experience in {{topSkills}} and {{keyHighlight}}.

I've attached my resume and would love to connect.

Best,
{{userName}}
{{phone}} | {{linkedinUrl}}`,
      tone: 'friendly',
      isSystem: true,
    },
    {
      name: 'Career Switch',
      description: 'For applicants switching domains',
      style: 'career-switch',
      subject: 'Transitioning to {{jobTitle}} — {{userName}}',
      body: `Hi {{recruiterName}},

I'm transitioning into {{jobTitle}} roles and am excited by the opportunity at {{company}}.

While my background is in {{previousDomain}}, I've been actively building in {{topSkills}} — {{keyHighlight}}

I'm a fast learner and highly motivated. Resume attached.

Would love to explore if there's a fit!

{{userName}}
{{phone}} | {{linkedinUrl}}`,
      tone: 'friendly',
      isSystem: true,
    },
  ];

  for (const template of templates) {
    await prisma.template.upsert({
      where: {
        // system templates identified by name
        id: `system-${template.style}`,
      },
      update: {},
      create: {
        id: `system-${template.style}`,
        userId: user.id,
        ...template,
      },
    });
    console.log(`✅ Template: ${template.name}`);
  }

  // Seed sample jobs for the dashboard
  const sampleJobs = [
    {
      title: 'Frontend Developer',
      company: 'TechCorp India',
      location: 'Bangalore',
      workMode: 'hybrid',
      jobType: 'full-time',
      experienceLevel: 'fresher',
      requiredSkills: ['React', 'TypeScript', 'CSS', 'HTML'],
      niceToHaveSkills: ['Next.js', 'GraphQL'],
      recruiterEmail: 'careers@techcorp.example',
      matchScore: 88,
      status: 'saved',
      source: 'manual',
    },
    {
      title: 'Software Engineer Intern',
      company: 'StartupXYZ',
      location: 'Remote',
      workMode: 'remote',
      jobType: 'internship',
      experienceLevel: 'fresher',
      requiredSkills: ['Python', 'Node.js', 'REST APIs'],
      recruiterEmail: 'hr@startupxyz.example',
      matchScore: 72,
      status: 'applied',
      source: 'remotive',
    },
  ];

  for (const job of sampleJobs) {
    await prisma.job.create({
      data: {
        userId: user.id,
        ...job,
      },
    });
    console.log(`✅ Job: ${job.title} at ${job.company}`);
  }

  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
