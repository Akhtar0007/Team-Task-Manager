const { PrismaClient } = require('@prisma/client');
const { Client } = require('pg');

const mongo = new PrismaClient();

const MODEL_MAP = {
  User: mongo.user,
  Project: mongo.project,
  ProjectMember: mongo.projectMember,
  Task: mongo.task,
  TaskFile: mongo.taskFile,
  ActivityLog: mongo.activityLog,
  TaskComment: mongo.taskComment,
  SubTask: mongo.subTask,
  Label: mongo.label,
  TaskLabel: mongo.taskLabel,
  Notification: mongo.notification,
  TaskDependency: mongo.taskDependency,
  TimeEntry: mongo.timeEntry,
  TaskWatcher: mongo.taskWatcher,
  Phase: mongo.phase,
  Issue: mongo.issue,
  ProjectDocument: mongo.projectDocument,
  ResourceLink: mongo.resourceLink,
  Conversation: mongo.conversation,
  ChatMessage: mongo.chatMessage,
};

const TABLES_TO_EXCLUDE = ['_prisma_migrations'];

async function migrate() {
  const pgClient = new Client({
    connectionString: 'postgresql://mdshahnawaz@localhost:5432/team_task_manager'
  });

  try {
    await pgClient.connect();
    console.log('Connected to PostgreSQL');

    const tablesRes = await pgClient.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    );
    const tables = tablesRes.rows
      .map(r => r.table_name)
      .filter(t => !TABLES_TO_EXCLUDE.includes(t));

    for (const table of tables) {
      const model = MODEL_MAP[table];
      if (!model) {
        console.log(`Skipping ${table}: no matching Prisma model`);
        continue;
      }

      const res = await pgClient.query(`SELECT * FROM public."${table}"`);
      const rows = res.rows;
      if (rows.length === 0) {
        console.log(`${table}: 0 rows, skipped`);
        continue;
      }

      let migrated = 0;
      for (const row of rows) {
        const data = { ...row };
        delete data.updatedAt;

        try {
          await model.create({ data });
          migrated++;
        } catch (err) {
          console.error(`  Failed ${table} ${row.id || ''}: ${err.message}`);
        }
      }
      console.log(`${table}: ${migrated}/${rows.length} rows migrated`);
    }

    console.log('\nMigration complete!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pgClient.end();
    await mongo.$disconnect();
  }
}

migrate();
