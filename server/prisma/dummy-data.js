const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const INDIAN_USERS = [
  { name: 'Rajesh Kumar', email: 'rajesh@example.com', role: 'MEMBER', password: 'Rajesh@123' },
  { name: 'Priya Sharma', email: 'priya@example.com', role: 'ADMIN', password: 'Priya@123' },
  { name: 'Amit Singh', email: 'amit@example.com', role: 'MEMBER', password: 'Amit@123' },
  { name: 'Sneha Patel', email: 'sneha@example.com', role: 'MEMBER', password: 'Sneha@123' },
  { name: 'Vikram Reddy', email: 'vikram@example.com', role: 'MEMBER', password: 'Vikram@123' },
  { name: 'Ananya Gupta', email: 'ananya@example.com', role: 'MEMBER', password: 'Ananya@123' },
  { name: 'Arun Joshi', email: 'arun@example.com', role: 'MEMBER', password: 'Arun@123' },
  { name: 'Deepa Nair', email: 'deepa@example.com', role: 'MEMBER', password: 'Deepa@123' },
  { name: 'Karan Mehta', email: 'karan@example.com', role: 'MEMBER', password: 'Karan@123' },
  { name: 'Neha Desai', email: 'neha@example.com', role: 'MEMBER', password: 'Neha@123' },
];

const PROJECTS = [
  { name: 'E-Commerce Platform', description: 'Building a full-stack e-commerce platform with React and Node.js' },
  { name: 'Mobile Banking App', description: 'Developing a secure mobile banking application for iOS and Android' },
  { name: 'Healthcare Portal', description: 'Creating a patient management system for hospitals' },
  { name: 'Smart City Dashboard', description: 'IoT-based city monitoring and management dashboard' },
  { name: 'Learning Management System', description: 'Online education platform with video streaming and assessments' },
];

const TASK_TEMPLATES = [
  { title: 'Set up project repository and CI/CD pipeline', status: 'DONE', priority: 'HIGH' },
  { title: 'Design database schema and models', status: 'DONE', priority: 'HIGH' },
  { title: 'Create REST API endpoints for user management', status: 'IN_PROGRESS', priority: 'HIGH' },
  { title: 'Implement authentication with JWT', status: 'DONE', priority: 'HIGH' },
  { title: 'Build responsive UI components', status: 'IN_PROGRESS', priority: 'MEDIUM' },
  { title: 'Write unit tests for core modules', status: 'TODO', priority: 'MEDIUM' },
  { title: 'Conduct code review and refactoring', status: 'TODO', priority: 'LOW' },
  { title: 'Deploy to staging environment', status: 'REVIEW', priority: 'HIGH' },
  { title: 'Performance optimization and caching', status: 'TODO', priority: 'MEDIUM' },
  { title: 'User acceptance testing', status: 'REVIEW', priority: 'HIGH' },
  { title: 'API documentation with Swagger', status: 'IN_PROGRESS', priority: 'LOW' },
  { title: 'Security audit and penetration testing', status: 'TODO', priority: 'URGENT' },
  { title: 'Implement real-time notifications', status: 'TODO', priority: 'MEDIUM' },
  { title: 'Set up monitoring and logging', status: 'DONE', priority: 'MEDIUM' },
  { title: 'Database backup and recovery plan', status: 'TODO', priority: 'HIGH' },
];

const LABELS = [
  { name: 'Frontend', color: '#3b82f6' },
  { name: 'Backend', color: '#10b981' },
  { name: 'Database', color: '#8b5cf6' },
  { name: 'DevOps', color: '#f59e0b' },
  { name: 'Bug', color: '#ef4444' },
  { name: 'Feature', color: '#06b6d4' },
  { name: 'Documentation', color: '#6366f1' },
  { name: 'Testing', color: '#84cc16' },
];

async function seed() {
  console.log('Seeding Indian users...');
  const createdUsers = {};
  const allUsers = [];

  for (const u of INDIAN_USERS) {
    let user = await prisma.user.findUnique({ where: { email: u.email } });
    if (!user) {
      const hashedPw = await bcrypt.hash(u.password, 12);
      user = await prisma.user.create({
        data: { name: u.name, email: u.email, password: hashedPw, role: u.role }
      });
      console.log(`  Created user: ${u.name} (${u.email})`);
    } else {
      console.log(`  Already exists: ${u.name}`);
    }
    createdUsers[u.email] = user;
    allUsers.push(user);
  }

  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@test.com' } });
  const superUser = await prisma.user.findUnique({ where: { email: 'shahnawaz2020mth@gmail.com' } });
  createdUsers['admin'] = adminUser;
  createdUsers['super'] = superUser;

  console.log('\nCreating projects...');
  const labelCache = {};

  for (let pi = 0; pi < PROJECTS.length; pi++) {
    const proj = PROJECTS[pi];
    let project = await prisma.project.findFirst({ where: { name: proj.name } });

    if (!project) {
      const creator = allUsers[pi % allUsers.length];
      project = await prisma.project.create({
        data: { name: proj.name, description: proj.description, createdBy: creator.id }
      });
      console.log(`  Created project: ${proj.name}`);
    } else {
      console.log(`  Already exists: ${proj.name}`);
    }

    const existingMembers = await prisma.projectMember.findMany({
      where: { projectId: project.id },
      select: { userId: true }
    });
    const existingUserIds = existingMembers.map(m => m.userId);

    const adminMember = createdUsers['admin'];
    if (!existingUserIds.includes(adminMember.id)) {
      await prisma.projectMember.create({
        data: { projectId: project.id, userId: adminMember.id, role: 'ADMIN' }
      });
    }

    const memberCount = Math.min(3 + pi, allUsers.length);
    for (let mi = 0; mi < memberCount; mi++) {
      const user = allUsers[(pi + mi * 3) % allUsers.length];
      if (!existingUserIds.includes(user.id) && user.id !== adminMember.id) {
        await prisma.projectMember.create({
          data: { projectId: project.id, userId: user.id, role: mi === 0 ? 'ADMIN' : 'MEMBER' }
        });
      }
    }

    const phaseNames = ['Planning', 'Design', 'Development', 'Testing', 'Deployment'];
    for (const pn of phaseNames) {
      const existingPhase = await prisma.phase.findFirst({
        where: { projectId: project.id, name: pn }
      });
      if (!existingPhase) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + phaseNames.indexOf(pn) * 14);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 13);
        const phaseStatuses = ['PLANNED', 'ACTIVE', 'ACTIVE', 'PLANNED', 'PLANNED'];
        await prisma.phase.create({
          data: {
            name: pn,
            description: `${pn} phase for ${proj.name}`,
            startDate,
            endDate,
            status: phaseStatuses[phaseNames.indexOf(pn)],
            projectId: project.id
          }
        });
      }
    }

    for (const label of LABELS) {
      const existingLabel = await prisma.label.findFirst({
        where: { projectId: project.id, name: label.name }
      });
      if (!existingLabel) {
        const created = await prisma.label.create({
          data: { name: label.name, color: label.color, projectId: project.id }
        });
        if (!labelCache[project.id]) labelCache[project.id] = [];
        labelCache[project.id].push(created);
      } else {
        if (!labelCache[project.id]) labelCache[project.id] = [];
        labelCache[project.id].push(existingLabel);
      }
    }

    const projectMembers = await prisma.projectMember.findMany({
      where: { projectId: project.id }
    });
    const memberIds = projectMembers.map(m => m.userId);

    for (let ti = 0; ti < TASK_TEMPLATES.length; ti++) {
      const tmpl = TASK_TEMPLATES[ti];
      const existingTask = await prisma.task.findFirst({
        where: { projectId: project.id, title: tmpl.title }
      });

      if (!existingTask) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30) + 1);
        const assigneeId = memberIds[Math.floor(Math.random() * memberIds.length)];
        const creatorId = memberIds[Math.floor(Math.random() * memberIds.length)];

        const task = await prisma.task.create({
          data: {
            title: tmpl.title,
            description: `${tmpl.title} for ${proj.name}`,
            status: tmpl.status,
            priority: tmpl.priority,
            dueDate: tmpl.status === 'DONE' ? new Date(Date.now() - Math.random() * 86400000 * 5) : dueDate,
            projectId: project.id,
            assigneeId,
            createdById: creatorId
          }
        });

        const projLabels = labelCache[project.id] || [];
        if (projLabels.length > 0) {
          const randomLabel = projLabels[Math.floor(Math.random() * projLabels.length)];
          await prisma.taskLabel.create({
            data: { taskId: task.id, labelId: randomLabel.id }
          });
        }

        if (tmpl.status !== 'TODO' && Math.random() > 0.5) {
          const commentUser = memberIds[Math.floor(Math.random() * memberIds.length)];
          const comments = ['Great progress!', 'Need to review this', 'Looks good to me', 'Working on it', 'Blocked by dependencies'];
          await prisma.taskComment.create({
            data: {
              content: comments[Math.floor(Math.random() * comments.length)],
              taskId: task.id,
              userId: commentUser
            }
          });
        }

        if (tmpl.status !== 'DONE' && Math.random() > 0.6) {
          await prisma.timeEntry.create({
            data: {
              hours: Math.round((Math.random() * 8 + 1) * 100) / 100,
              description: `Worked on ${tmpl.title}`,
              taskId: task.id,
              userId: assigneeId
            }
          });
        }
      }
    }

    await logActivity(superUser.id, 'SEED', 'Project', project.id, `Seeded project "${proj.name}" with tasks and members`);
  }

  console.log('\n✅ Seeding complete!');
  printSummary();
}

async function logActivity(userId, action, entity, entityId, details) {
  try {
    await prisma.activityLog.create({ data: { userId, action, entity, entityId, details } });
  } catch (e) {}
}

async function printSummary() {
  const users = await prisma.user.count();
  const projects = await prisma.project.count();
  const tasks = await prisma.task.count();
  const members = await prisma.projectMember.count();
  const comments = await prisma.taskComment.count();
  const phases = await prisma.phase.count();
  const labels = await prisma.label.count();
  console.log(`  Users: ${users}`);
  console.log(`  Projects: ${projects}`);
  console.log(`  Tasks: ${tasks}`);
  console.log(`  Members: ${members}`);
  console.log(`  Comments: ${comments}`);
  console.log(`  Phases: ${phases}`);
  console.log(`  Labels: ${labels}`);
}

seed()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
