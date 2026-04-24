import "server-only";
import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import caseData from "@/data/cases/hc_48h_001/case.json";
import documents from "@/data/cases/hc_48h_001/documents.json";
import scoringRules from "@/data/cases/hc_48h_001/scoring-rules.json";
import steps from "@/data/cases/hc_48h_001/steps.json";
import type { CaseData, CaseDocument, ScoringRule, Step } from "@/lib/game-types";

const typedCaseData = caseData as CaseData;
const typedDocuments = documents as CaseDocument[];
const typedSteps = steps as Step[];
const typedScoringRules = scoringRules as ScoringRule[];

const dbDirectory = path.join(process.cwd(), "db");
const dbFilePath = path.join(dbDirectory, "lexquest.sqlite");

let database: DatabaseSync | null = null;

function seedStaticContent(db: DatabaseSync) {
  const caseExists = db.prepare("select id from cases where id = ?").get(typedCaseData.case.id) as
    | { id: string }
    | undefined;

  if (!caseExists) {
    db.prepare(
      `
        insert into cases (id, title, description, area, difficulty, created_at)
        values (?, ?, ?, ?, ?, ?)
      `
    ).run(
      typedCaseData.case.id,
      typedCaseData.case.title,
      typedCaseData.case.description,
      typedCaseData.case.area,
      typedCaseData.case.difficulty,
      new Date().toISOString()
    );
  }

  const insertDocument = db.prepare(
    `
      insert or ignore into case_documents (id, case_id, title, document_type, content, unlock_step)
      values (?, ?, ?, ?, ?, ?)
    `
  );

  for (const document of typedDocuments) {
    insertDocument.run(
      document.id,
      typedCaseData.case.id,
      document.title,
      document.type,
      document.content,
      document.unlock_step
    );
  }

  const insertStep = db.prepare(
    `
      insert or ignore into case_steps (
        id,
        case_id,
        step_number,
        title,
        situation,
        question,
        options,
        unlock_documents
      )
      values (?, ?, ?, ?, ?, ?, ?, ?)
    `
  );

  for (const step of typedSteps) {
    insertStep.run(
      step.id,
      step.case_id,
      step.step_number,
      step.title,
      step.situation,
      step.question,
      JSON.stringify(step.options ?? []),
      JSON.stringify(step.unlock_documents ?? [])
    );
  }

  const insertRule = db.prepare(
    `
      insert or ignore into scoring_rules (
        id,
        case_id,
        step_number,
        choice_key,
        delta_legalidade,
        delta_estrategia,
        delta_etica,
        flags,
        explanation
      )
      values (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  );

  for (const rule of typedScoringRules) {
    insertRule.run(
      `${typedCaseData.case.id}_${rule.step}_${rule.choice}`,
      typedCaseData.case.id,
      rule.step,
      rule.choice,
      rule.legalidade,
      rule.estrategia,
      rule.etica,
      JSON.stringify(rule.flags),
      rule.explanation
    );
  }
}

function initializeDatabase() {
  if (!existsSync(dbDirectory)) {
    mkdirSync(dbDirectory, { recursive: true });
  }

  const db = new DatabaseSync(dbFilePath);

  db.exec(`
    pragma journal_mode = WAL;

    create table if not exists cases (
      id text primary key,
      title text not null,
      description text,
      area text,
      difficulty text,
      created_at text default current_timestamp
    );

    create table if not exists case_documents (
      id text primary key,
      case_id text references cases(id),
      title text not null,
      document_type text,
      content text not null,
      unlock_step integer default 1
    );

    create table if not exists case_steps (
      id text primary key,
      case_id text references cases(id),
      step_number integer not null,
      title text not null,
      situation text not null,
      question text not null,
      options text not null,
      unlock_documents text default '[]'
    );

    create table if not exists player_sessions (
      id text primary key,
      user_id text,
      case_id text references cases(id),
      current_step integer default 1,
      legalidade integer default 50,
      estrategia integer default 50,
      etica integer default 50,
      state text default '{}',
      created_at text default current_timestamp,
      updated_at text default current_timestamp
    );

    create table if not exists player_choices (
      id text primary key,
      session_id text references player_sessions(id),
      step_id text references case_steps(id),
      choice_key text,
      free_text_argument text,
      score_legalidade integer default 0,
      score_estrategia integer default 0,
      score_etica integer default 0,
      feedback text,
      created_at text default current_timestamp
    );

    create table if not exists scoring_rules (
      id text primary key,
      case_id text references cases(id),
      step_number integer not null,
      choice_key text not null,
      delta_legalidade integer default 0,
      delta_estrategia integer default 0,
      delta_etica integer default 0,
      flags text default '[]',
      explanation text
    );

    create table if not exists ai_messages (
      id text primary key,
      session_id text references player_sessions(id),
      role text not null,
      content text not null,
      created_at text default current_timestamp
    );
  `);

  seedStaticContent(db);
  return db;
}

export function getDb() {
  if (!database) {
    database = initializeDatabase();
  }

  return database;
}

export { dbFilePath };
