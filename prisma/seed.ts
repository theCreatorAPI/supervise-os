import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { recomputeAllRisk } from "../lib/risk-engine";

const prisma = new PrismaClient();

const MILESTONE_TEMPLATE = [
  "Topic Approval",
  "Proposal",
  "Chapter 1",
  "Chapter 2",
  "Methodology",
  "Results",
  "Final Submission",
  "Defense",
] as const;

const DAY = 1000 * 60 * 60 * 24;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);
const daysFromNow = (n: number) => new Date(Date.now() + n * DAY);

const FIRST_NAMES = [
  "Ada", "Kwame", "Yuna", "Diego", "Priya", "Liam", "Fatima", "Noah", "Mei", "Sofia",
  "Tunde", "Elena", "Hassan", "Grace", "Chidi", "Amaka", "Leo", "Ines", "Sana", "Oliver",
  "Zara", "Marco", "Nia", "Ethan", "Amara", "Rafael", "Layla", "Kofi", "Wei", "Isabel",
  "Jamal", "Anya", "Femi", "Camila", "Dara", "Victor", "Aaliyah", "Ivan", "Nadia", "Segun",
  "Rosa", "Kenji", "Halima", "Bruno", "Yara", "Musa", "Freya", "Chike", "Lucia", "Adam",
  "Nkechi", "Theo", "Mariam", "Bode", "Selene", "Pablo", "Efe", "Tara", "Kian", "Zainab",
  "Miles", "Ngozi", "Elif", "Dante",
];
const LAST_NAMES = [
  "Okoro", "Chen", "Reyes", "Silva", "Bello", "Nakamura", "Osei", "Patel", "Duran", "Adeyemi",
  "Kim", "Osei-Bonsu", "Fernandez", "Diallo", "Hassan", "Costa", "Uche", "Novak", "Ibrahim", "Santos",
  "Mensah", "Kowalski", "Yusuf", "Rossi", "Abubakar", "Nakagawa", "Owusu", "Torres", "Nguyen", "Sow",
];

const PROJECT_TOPICS = [
  "Federated Learning for Low-Bandwidth Clinics",
  "A Lightweight Intrusion Detection System for IoT Networks",
  "Explainable AI for Credit Risk Scoring",
  "Real-Time Sign Language Translation Using Computer Vision",
  "Blockchain-Based Academic Credential Verification",
  "Predicting Student Dropout Risk with Machine Learning",
  "Serverless Architectures for Campus-Scale Web Services",
  "A Recommender System for Open-Access Research Papers",
  "Adversarial Robustness in Medical Image Classification",
  "Energy-Aware Task Scheduling in Edge Computing",
  "Natural Language Interfaces for Relational Databases",
  "Synthetic Data Generation for Rare Disease Diagnosis",
  "A Mobile App for Crowd-Sourced Road Hazard Reporting",
  "Graph Neural Networks for Fraud Detection in Fintech",
  "Automated Accessibility Auditing for Web Applications",
  "Voice-Controlled Smart Home Automation on Raspberry Pi",
  "Sentiment Analysis of Regional Dialects in Social Media",
  "Digital Twin Simulation for Campus Energy Management",
  "Privacy-Preserving Analytics with Differential Privacy",
  "A Peer-to-Peer File Sharing Protocol for Low-Connectivity Regions",
  "Deep Learning for Crop Disease Detection from Drone Imagery",
  "Procedural Generation of Game Levels with Reinforcement Learning",
  "A Comparative Study of Vector Databases for Semantic Search",
  "Automated Code Review Assistant Using Large Language Models",
  "Wearable Sensor Fusion for Fall Detection in Elderly Care",
  "Optimizing Traffic Light Timing with Multi-Agent Reinforcement Learning",
  "A Secure Multi-Party Computation Framework for Healthcare Data",
  "Low-Resource Machine Translation for Indigenous Languages",
  "Detecting Deepfakes Using Frequency Domain Analysis",
  "A Distributed Ledger for Supply Chain Provenance Tracking",
  "Gesture-Based Control for Assistive Robotics",
  "Automated Test Case Generation Using Genetic Algorithms",
  "Context-Aware Chatbots for University Helpdesk Support",
  "Anomaly Detection in Industrial IoT Sensor Streams",
  "A Study of Cold-Start Solutions in Recommendation Engines",
  "Building a Carbon Footprint Tracker for Small Businesses",
  "Speech Emotion Recognition for Mental Health Screening",
  "Optimistic Concurrency Control for Collaborative Text Editors",
  "A Framework for No-Code Machine Learning Pipelines",
  "Cross-Platform Performance Benchmarking of Mobile Frameworks",
];

const RETURN_COMMENTS = [
  "The literature review is thin — you're citing five sources where this section needs fifteen. Go deeper before resubmitting.",
  "Your methodology doesn't match what you described in the proposal. We need to talk about this before you continue.",
  "Formatting is inconsistent throughout and the citations aren't in the required style. Fix and resubmit.",
  "This reads like a first draft, not a second submission. The structural issues from last time are still here.",
];

const APPROVE_COMMENTS = [
  "Solid work. Clear structure, well-supported claims. Move on to the next milestone.",
  "This is a strong improvement over the last draft — approved. Keep this level of rigor going forward.",
  "Nicely done. Your methodology section is especially clear. Approved.",
  "Good progress. A few minor typos but nothing blocking — approved, fix them in the next pass.",
];

function pick<T>(arr: readonly T[], seed: number) {
  return arr[seed % arr.length];
}

function shuffledIndices(n: number, seed: number) {
  const arr = Array.from({ length: n }, (_, i) => i);
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

type MilestoneRow = { id: string; name: string; order: number };

// Default template due dates, kept safely in the future so a fresh project never
// shows MILESTONE_OVERDUE just because a milestone hasn't been started yet.
function templateDueDate(order: number) {
  return daysFromNow(order * 14 - 7);
}

async function seedMilestoneApproved(
  milestone: MilestoneRow,
  lecturerId: string,
  submittedDaysAgo: number,
  feedbackDaysAgo: number,
  fileTag: string
) {
  const submission = await prisma.submission.create({
    data: {
      milestoneId: milestone.id,
      version: 1,
      fileUrl: "/api/uploads/seed-placeholder.pdf",
      fileName: `${fileTag}-${milestone.name.replace(/\s+/g, "_")}.pdf`,
      fileSize: 180_000 + Math.floor(Math.random() * 900_000),
      submittedAt: daysAgo(submittedDaysAgo),
    },
  });
  await prisma.review.create({
    data: {
      submissionId: submission.id,
      lecturerId,
      comment: pick(APPROVE_COMMENTS, milestone.order),
      decision: "APPROVED",
      createdAt: daysAgo(feedbackDaysAgo),
    },
  });
  await prisma.milestone.update({
    where: { id: milestone.id },
    data: { status: "APPROVED", approvedAt: daysAgo(feedbackDaysAgo) },
  });
}

async function main() {
  console.log("Clearing existing data...");
  await prisma.auditEvent.deleteMany();
  await prisma.riskIndicator.deleteMany();
  await prisma.review.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  console.log("Creating departments...");
  const departmentNames = ["Computer Science", "Software Engineering", "Information Technology"];
  const departments = [];
  for (const name of departmentNames) {
    departments.push(await prisma.department.create({ data: { name } }));
  }
  const csDept = departments[0];

  console.log("Creating management account...");
  const management = await prisma.user.create({
    data: {
      name: "Dr. Folasade Bankole",
      email: "management@demo.io",
      passwordHash,
      role: "MANAGEMENT",
      status: "ACTIVE",
      departmentId: csDept.id,
      title: "Head of Department",
    },
  });

  console.log("Creating lecturers...");
  const lecturerDefs = [
    { name: "Dr. Amara Chen", email: "lecturer1@demo.io", target: 21, maxLoad: 22, title: "Senior Lecturer", staffId: "STF-10231" },
    { name: "Dr. Kwabena Mensah", email: "lecturer2@demo.io", target: 8, maxLoad: 15, title: "Lecturer", staffId: "STF-10456" },
    { name: "Dr. Ifeoma Okafor", email: "lecturer3@demo.io", target: 24, maxLoad: 20, title: "Associate Professor", staffId: "STF-10789" },
    { name: "Dr. Ricardo Reyes", email: "lecturer4@demo.io", target: 11, maxLoad: 15, title: "Lecturer", staffId: "STF-11024" },
  ];

  const lecturers = [];
  for (const def of lecturerDefs) {
    const lecturer = await prisma.user.create({
      data: {
        name: def.name,
        email: def.email,
        passwordHash,
        role: "LECTURER",
        status: "ACTIVE",
        departmentId: csDept.id,
        title: def.title,
        maxLoad: def.maxLoad,
        staffId: def.staffId,
      },
    });
    lecturers.push({ ...lecturer, target: def.target });
  }

  let globalStudentCounter = 0;
  let heroCounter = 0;
  const nameOrder = shuffledIndices(FIRST_NAMES.length * LAST_NAMES.length, 42);

  function nextName() {
    const idx = nameOrder[globalStudentCounter % nameOrder.length];
    const first = FIRST_NAMES[idx % FIRST_NAMES.length];
    const last = LAST_NAMES[Math.floor(idx / FIRST_NAMES.length) % LAST_NAMES.length];
    return `${first} ${last}`;
  }

  for (const lecturer of lecturers) {
    console.log(`Seeding ${lecturer.target} students for ${lecturer.name}...`);

    for (let i = 0; i < lecturer.target; i++) {
      globalStudentCounter++;
      const name = nextName();
      const email = `student${globalStudentCounter}@demo.io`;
      const matricNumber = `CSC/2022/${String(globalStudentCounter).padStart(3, "0")}`;
      const student = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "STUDENT",
          status: "ACTIVE",
          departmentId: csDept.id,
          matricNumber,
          pendingSupervisorId: lecturer.id,
        },
      });

      const title = pick(PROJECT_TOPICS, globalStudentCounter + heroCounter);
      const archetype = i < 4 ? i : -1; // first 4 students per lecturer are "hero" archetypes

      const project = await prisma.project.create({
        data: {
          title,
          description: `An undergraduate final-year project on ${title.toLowerCase()}.`,
          programme: "B.Sc. Computer Science",
          session: "2025/2026",
          studentId: student.id,
          supervisorId: lecturer.id,
          departmentId: csDept.id,
          status: lecturer.email === "lecturer4@demo.io" && archetype === 0 ? "DEFENDED" : "ACTIVE",
          milestones: {
            create: MILESTONE_TEMPLATE.map((mName, idx) => ({
              name: mName,
              order: idx + 1,
              dueDate: templateDueDate(idx + 1),
            })),
          },
        },
        include: { milestones: { orderBy: { order: "asc" } } },
      });
      const milestones = project.milestones;

      if (lecturer.email === "lecturer4@demo.io" && archetype === 0) {
        // Fully defended project — every milestone approved, long ago.
        for (const [idx, m] of milestones.entries()) {
          await seedMilestoneApproved(m, lecturer.id, 120 - idx * 10, 118 - idx * 10, `v1`);
        }
        await prisma.meeting.create({
          data: {
            projectId: project.id,
            title: "Final defense",
            scheduledAt: daysAgo(15),
            notes: "Defended successfully. Panel approved with minor corrections.",
            completed: true,
          },
        });
        continue;
      }

      if (archetype === 0) {
        // NORMAL — clean, steady progress
        await seedMilestoneApproved(milestones[0], lecturer.id, 55, 53, "v1");
        await seedMilestoneApproved(milestones[1], lecturer.id, 38, 36, "v1");
        await seedMilestoneApproved(milestones[2], lecturer.id, 20, 18, "v1");
        // milestone 4 submitted recently, awaiting review (within window)
        await prisma.submission.create({
          data: {
            milestoneId: milestones[3].id,
            version: 1,
            fileUrl: "/api/uploads/seed-placeholder.pdf",
            fileName: `v1-${milestones[3].name.replace(/\s+/g, "_")}.pdf`,
            fileSize: 240_000,
            submittedAt: daysAgo(3),
          },
        });
        await prisma.milestone.update({ where: { id: milestones[3].id }, data: { status: "UNDER_REVIEW" } });
        await prisma.meeting.create({
          data: { projectId: project.id, title: "Progress check-in", scheduledAt: daysAgo(10), completed: true, notes: "Discussed Chapter 2 revisions." },
        });
        await prisma.meeting.create({
          data: { projectId: project.id, title: "Methodology review", scheduledAt: daysFromNow(6), completed: false },
        });
        await prisma.notification.create({
          data: { userId: lecturer.id, message: `${name} submitted "${milestones[3].name}" (v1) for review.`, link: `/lecturer/students/${project.id}` },
        });
      } else if (archetype === 1) {
        // AT_RISK — repeated returns on the same milestone
        await seedMilestoneApproved(milestones[0], lecturer.id, 45, 43, "v1");
        const s1 = await prisma.submission.create({
          data: { milestoneId: milestones[1].id, version: 1, fileUrl: "/api/uploads/seed-placeholder.pdf", fileName: `v1-${milestones[1].name.replace(/\s+/g, "_")}.pdf`, fileSize: 210_000, submittedAt: daysAgo(20) },
        });
        await prisma.review.create({
          data: { submissionId: s1.id, lecturerId: lecturer.id, comment: pick(RETURN_COMMENTS, 0), decision: "RETURNED", createdAt: daysAgo(17) },
        });
        const s2 = await prisma.submission.create({
          data: { milestoneId: milestones[1].id, version: 2, fileUrl: "/api/uploads/seed-placeholder.pdf", fileName: `v2-${milestones[1].name.replace(/\s+/g, "_")}.pdf`, fileSize: 215_000, submittedAt: daysAgo(9) },
        });
        await prisma.review.create({
          data: { submissionId: s2.id, lecturerId: lecturer.id, comment: pick(RETURN_COMMENTS, 1), decision: "RETURNED", createdAt: daysAgo(6) },
        });
        await prisma.milestone.update({ where: { id: milestones[1].id }, data: { status: "RETURNED" } });
        await prisma.notification.create({
          data: { userId: student.id, message: `${lecturer.name} returned "${milestones[1].name}" — 2nd revision needed.`, link: `/student` },
        });
      } else if (archetype === 2) {
        // CRITICAL — stale submission (35+ days) + a missed meeting
        await seedMilestoneApproved(milestones[0], lecturer.id, 60, 58, "v1");
        const s1 = await prisma.submission.create({
          data: { milestoneId: milestones[1].id, version: 1, fileUrl: "/api/uploads/seed-placeholder.pdf", fileName: `v1-${milestones[1].name.replace(/\s+/g, "_")}.pdf`, fileSize: 198_000, submittedAt: daysAgo(41) },
        });
        await prisma.review.create({
          data: { submissionId: s1.id, lecturerId: lecturer.id, comment: pick(APPROVE_COMMENTS, 2), decision: "APPROVED", createdAt: daysAgo(39) },
        });
        await prisma.milestone.update({ where: { id: milestones[1].id }, data: { status: "APPROVED", approvedAt: daysAgo(39) } });
        await prisma.meeting.create({
          data: { projectId: project.id, title: "Chapter 2 supervision", scheduledAt: daysAgo(12), completed: false, notes: "Student did not attend." },
        });
      } else if (archetype === 3) {
        // AT_RISK — milestone due date passed without being approved
        await seedMilestoneApproved(milestones[0], lecturer.id, 16, 14, "v1");
        await prisma.milestone.update({
          where: { id: milestones[1].id },
          data: { dueDate: daysAgo(5), status: "IN_PROGRESS" },
        });
        await prisma.notification.create({
          data: { userId: lecturer.id, message: `${name}'s "${milestones[1].name}" is now past its due date.`, link: `/lecturer/students/${project.id}` },
        });
      } else {
        // Filler students — light but valid history, mostly on-schedule.
        // Approved milestones are dated recently (<21 days) so the stale-submission
        // risk rule doesn't misfire just because a student is waiting on their next deadline.
        let approvedCount = Math.floor(Math.random() * 3); // 0-2 milestones approved
        const isSparseAtRisk = Math.random() < 0.12;
        if (isSparseAtRisk && approvedCount === 0) approvedCount = 1;

        for (let a = 0; a < approvedCount; a++) {
          const isLastApproved = a === approvedCount - 1;
          const submittedDaysAgo = isSparseAtRisk && isLastApproved ? 26 : 16 - a * 6;
          await seedMilestoneApproved(milestones[a], lecturer.id, submittedDaysAgo, submittedDaysAgo - 2, "v1");
        }

        if (!isSparseAtRisk && approvedCount < MILESTONE_TEMPLATE.length) {
          const nextIdx = approvedCount;
          if (Math.random() < 0.35) {
            await prisma.submission.create({
              data: {
                milestoneId: milestones[nextIdx].id,
                version: 1,
                fileUrl: "/api/uploads/seed-placeholder.pdf",
                fileName: `v1-${milestones[nextIdx].name.replace(/\s+/g, "_")}.pdf`,
                fileSize: 175_000,
                submittedAt: daysAgo(Math.floor(Math.random() * 6) + 1),
              },
            });
            await prisma.milestone.update({ where: { id: milestones[nextIdx].id }, data: { status: "UNDER_REVIEW" } });
          } else {
            await prisma.milestone.update({ where: { id: milestones[nextIdx].id }, data: { status: "IN_PROGRESS" } });
          }
        }
        await prisma.meeting.create({
          data: { projectId: project.id, title: "Supervision check-in", scheduledAt: daysFromNow(Math.floor(Math.random() * 14) + 2), completed: false },
        });
      }
    }
    heroCounter += 4;
  }

  // Demonstrate the lecturer-creates-student activation flow with one pending account.
  console.log("Seeding one pending-activation student...");
  await prisma.user.create({
    data: {
      name: "Priya Osei-Bonsu",
      email: "student.pending@demo.io",
      role: "STUDENT",
      status: "PENDING_ACTIVATION",
      departmentId: csDept.id,
      matricNumber: "CSC/2022/999",
      pendingSupervisorId: lecturers[0].id,
      activationToken: "demo-activation-token",
    },
  });

  console.log("Recomputing risk levels and risk indicators...");
  await recomputeAllRisk();

  console.log("Seed complete.");
  console.log(`Users: ${2 + lecturers.length + globalStudentCounter} (${management.name} as management, ${lecturers.length} lecturers, ${globalStudentCounter + 1} students incl. 1 pending activation)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
