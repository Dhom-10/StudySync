import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@studysync.dev" },
    update: {},
    create: {
      name: "Ada Admin",
      email: "admin@studysync.dev",
      passwordHash,
      role: "admin",
    },
  });

  const student = await prisma.user.upsert({
    where: { email: "student@studysync.dev" },
    update: {},
    create: {
      name: "Sam Student",
      email: "student@studysync.dev",
      passwordHash,
      role: "student",
    },
  });

  const biology = await prisma.subject.upsert({
    where: { userId_name: { userId: student.id, name: "Biology" } },
    update: {},
    create: { userId: student.id, name: "Biology", color: "#2F8F5B" },
  });

  await prisma.subject.upsert({
    where: { userId_name: { userId: student.id, name: "Calculus" } },
    update: {},
    create: { userId: student.id, name: "Calculus", color: "#B7791F" },
  });

  const existingLesson = await prisma.lesson.findFirst({
    where: { userId: student.id, title: "Cell Membranes & Transport" },
  });

  if (!existingLesson) {
    await prisma.lesson.create({
      data: {
        userId: student.id,
        subjectId: biology.id,
        title: "Cell Membranes & Transport",
        durationSec: 2760,
        transcript:
          "Today we covered the structure of the phospholipid bilayer, passive vs active transport, " +
          "osmosis, and the role of membrane proteins. Quiz on chapter 5 next Tuesday. Reading due Friday.",
        tasks: {
          create: [{ text: "Review chapter 5 reading" }, { text: "Make flashcards for transport types" }],
        },
        summary: {
          create: {
            suggestedTitle: "Cell Membranes & Transport",
            topics: ["Phospholipid bilayer", "Passive vs active transport", "Osmosis", "Membrane proteins"],
            keyPoints: [
              "The bilayer is selectively permeable due to its hydrophobic core",
              "Active transport requires ATP; passive transport does not",
              "Osmosis is the diffusion of water across a membrane",
            ],
            studyTips: [
              "Draw the bilayer from memory and label each transport type",
              "Compare active vs passive transport in a two-column table",
            ],
            dates: ["Quiz next Tuesday"],
          },
        },
        assignments: {
          create: [
            {
              userId: student.id,
              text: "Chapter 5 reading",
              dueDate: nextFriday(),
              dueTime: null,
              source: "lesson",
            },
          ],
        },
      },
    });
  }

  console.log("Seed complete.");
  console.log("  admin:   admin@studysync.dev / password123");
  console.log("  student: student@studysync.dev / password123");
}

function nextFriday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (5 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
