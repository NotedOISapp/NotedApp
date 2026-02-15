import { pgTable, text, timestamp, uuid, jsonb, boolean, integer, pgEnum } from "drizzle-orm/pg-core";

// Enums
export const agentStatusEnum = pgEnum('agent_status', ['IDLE', 'RUNNING', 'PAUSED', 'ERROR']);
export const inboxPriorityEnum = pgEnum('inbox_priority', ['P0', 'P1', 'P2', 'P3']);
export const inboxStatusEnum = pgEnum('inbox_status', ['NEW', 'READ', 'ACTIONED', 'ARCHIVED']);

// 1. Agents (The Fleet)
export const agents = pgTable("agents", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(), // "Agent 1"
    role: text("role").notNull(), // "Governance", "Coder"
    status: agentStatusEnum("status").default('IDLE'),
    currentTask: text("current_task"),
    lastHeartbeat: timestamp("last_heartbeat").defaultNow(),
    config: jsonb("config"), // Model, Tools
});

// 2. Tasks (The Intent)
export const tasks = pgTable("tasks", {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    status: text("status").default('PENDING'), // PENDING, IN_PROGRESS, DONE, FAILED
    agentId: uuid("agent_id").references(() => agents.id),
    createdAt: timestamp("created_at").defaultNow(),
});

// 3. Runs (The Execution)
export const runs = pgTable("runs", {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id").references(() => tasks.id),
    agentId: uuid("agent_id").references(() => agents.id),
    status: text("status").notNull(), // RELAYS Agent Status
    startedAt: timestamp("started_at").defaultNow(),
    endedAt: timestamp("ended_at"),
    cost: integer("cost_cents").default(0),
});

// 4. Sessions (The Trace Envelope)
export const sessions = pgTable("sessions", {
    id: uuid("id").defaultRandom().primaryKey(),
    runId: uuid("run_id").references(() => runs.id),
    summary: text("summary"), // LLM Generated
    logs: jsonb("logs"), // Redacted Logs
    artifacts: jsonb("artifacts"), // Files changed
});

// 5. Inbox Items (Unified Queue)
export const inboxItems = pgTable("inbox_items", {
    id: uuid("id").defaultRandom().primaryKey(),
    type: text("type").notNull(), // "IDEA", "ALERT", "APPROVAL"
    source: text("source").notNull(), // "TELEGRAM", "SENTRY", "VERCEL"
    title: text("title").notNull(),
    body: text("body"),
    priority: inboxPriorityEnum("priority").default('P2'),
    status: inboxStatusEnum("status").default('NEW'),
    metadata: jsonb("metadata"), // External IDs
    createdAt: timestamp("created_at").defaultNow(),
});

// 6. Deploys (Vercel Sync)
export const deploys = pgTable("deploys", {
    id: uuid("id").defaultRandom().primaryKey(),
    environment: text("environment").notNull(), // "production", "preview"
    commitSha: text("commit_sha"),
    status: text("status"), // "READY", "ERROR"
    url: text("url"),
    deployedAt: timestamp("deployed_at"),
});
