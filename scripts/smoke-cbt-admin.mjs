#!/usr/bin/env node
/**
 * CBT Admin API smoke test (non-destructive).
 *
 * Usage:
 *   node scripts/smoke-cbt-admin.mjs --base-url https://xxxx.pages.dev
 *   BASE_URL=https://xxxx.pages.dev node scripts/smoke-cbt-admin.mjs
 */

const args = process.argv.slice(2);

const getArgValue = (name) => {
  const idx = args.findIndex((arg) => arg === `--${name}`);
  if (idx === -1) return undefined;
  return args[idx + 1];
};

const baseUrl = (getArgValue("base-url") || process.env.BASE_URL || "").replace(/\/$/, "");

if (!baseUrl) {
  console.error("[FAIL] BASE_URL이 필요합니다. (--base-url 또는 BASE_URL 환경변수)");
  process.exit(1);
}

const checks = [];

const check = async (name, fn) => {
  try {
    await fn();
    checks.push({ name, ok: true });
    console.log(`[PASS] ${name}`);
  } catch (error) {
    checks.push({ name, ok: false, message: error.message });
    console.error(`[FAIL] ${name}: ${error.message}`);
  }
};

const fetchJson = async (path, init = {}) => {
  const response = await fetch(`${baseUrl}${path}`, init);
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  return { response, data };
};

const expectStatus = (actual, expected, label) => {
  if (actual !== expected) {
    throw new Error(`${label} status ${actual} (expected ${expected})`);
  }
};

const expectTruthy = (value, label) => {
  if (!value) throw new Error(`${label}가 비어있습니다.`);
};

await check("CBT 시험 목록 조회", async () => {
  const { response, data } = await fetchJson("/api/cbt/exams");
  expectStatus(response.status, 200, "GET /api/cbt/exams");
  if (!Array.isArray(data?.exams)) {
    throw new Error("응답 exams 배열 형식이 올바르지 않습니다.");
  }
});

await check("CBT 관리자 로그 조회", async () => {
  const { response, data } = await fetchJson("/api/cbt/admin/logs?limit=5");
  expectStatus(response.status, 200, "GET /api/cbt/admin/logs");
  if (!Array.isArray(data?.logs)) {
    throw new Error("응답 logs 배열 형식이 올바르지 않습니다.");
  }
});

let sampleCourseId = "";
await check("문제은행 과정 목록 조회(scope=courses)", async () => {
  const { response, data } = await fetchJson("/api/cbt/admin/question-pool?scope=courses");
  expectStatus(response.status, 200, "GET /api/cbt/admin/question-pool?scope=courses");
  if (!Array.isArray(data?.courses)) {
    throw new Error("응답 courses 배열 형식이 올바르지 않습니다.");
  }
  if (data.courses.length > 0) {
    sampleCourseId = data.courses[0].id;
    expectTruthy(sampleCourseId, "샘플 courseId");
  }
});

await check("문제은행 과목 목록 조회(scope=subjects)", async () => {
  if (!sampleCourseId) {
    console.log("[SKIP] 과정 데이터가 없어 과목 조회를 건너뜁니다.");
    return;
  }
  const { response, data } = await fetchJson(
    `/api/cbt/admin/question-pool?scope=subjects&courseId=${encodeURIComponent(sampleCourseId)}`
  );
  expectStatus(response.status, 200, "GET /api/cbt/admin/question-pool?scope=subjects");
  if (!Array.isArray(data?.subjects)) {
    throw new Error("응답 subjects 배열 형식이 올바르지 않습니다.");
  }
});

await check("권한 검증: 생성 API는 인증정보 없으면 401", async () => {
  const { response } = await fetchJson("/api/cbt/exams", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "smoke_no_auth",
      courseId: "course_dummy",
      questionIds: ["q_dummy"]
    })
  });
  expectStatus(response.status, 401, "POST /api/cbt/exams");
});

await check("권한 검증: 수정 API는 인증정보 없으면 401", async () => {
  const { response } = await fetchJson("/api/cbt/exams/fake_exam_id_for_smoke", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "smoke_update_no_auth" })
  });
  expectStatus(response.status, 401, "PUT /api/cbt/exams/:id");
});

await check("권한 검증: 복제 API는 인증정보 없으면 401", async () => {
  const { response } = await fetchJson("/api/cbt/exams/fake_exam_id_for_smoke/copy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ titleSuffix: "smoke" })
  });
  expectStatus(response.status, 401, "POST /api/cbt/exams/:id/copy");
});

const failed = checks.filter((c) => !c.ok);
console.log("");
console.log(`Smoke check result: ${checks.length - failed.length}/${checks.length} passed`);

if (failed.length > 0) {
  process.exit(1);
}

process.exit(0);
