# HUBMI — Tasks for Three Contributors

This is a work allocation, not an implementation status report. Product behavior and scope come from [README.md](README.md). All checklist items are initially pending. The interface must be in Polish.

**Highest priority: a user describes a problem and receives relevant existing solutions.** Complete this integrated path before expanding the remaining modules. All agreed features remain in scope; the order below is a proposed implementation sequence.

| Task | Owner | Responsibility |
| --- | --- | --- |
| 1 | Person 1 | Full frontend: citizen, institution, and administrator interfaces |
| 2 | Person 2 | Python application backend, relational data, permissions, and workflows |
| 3 | Person 3 | Ingestion, local embeddings, retrieval, generative AI, and vector projection |

## Folder Ownership — Minimize Merge Conflicts

The paths below define where future work belongs; this planning task does not create or move implementation files.

```text
frontend/front/                  Person 1 only
  src/                          All user and administrator UI
  tests/                        Component/UI tests and local API fixtures
  e2e/                          Browser tests against a mocked API
  package.json + lockfile       Frontend dependencies and test commands
  README.md                     Frontend setup and test instructions

backend/app/                    Person 2 only
  src/                          HTTP API, workflows, PostgreSQL and AI adapters
  contracts/                    Public OpenAPI contract and response examples
  migrations/                   ALL shared database migrations
  tests/                        Backend tests, fake AI service, database fixtures
  pyproject.toml + lockfile      Application dependencies and test configuration
  README.md                     Backend setup and test instructions

backend/ai/                     Person 3 only
  src/                          Importable AI/retrieval package and prompts
  contracts/                    Typed AI DTOs and repository/provider interfaces
  tests/                        AI tests, fake providers, fake repositories
  evaluation/                   Synthetic retrieval examples and optional live checks
  pyproject.toml + lockfile      AI dependencies and test configuration
  README.md                     AI setup and test instructions
backend/scrap/                  Person 3 only; existing scraper and its tests
backend/data/                   Person 3 only; source corpus, no shared test state

integration/                   Person 2 only
  tests/                        Cross-module checks
  fixtures/                     Synthetic integrated scenario data
  README.md                     Combined startup and verification commands
  compose/configuration         Only if needed; no root-level shared configuration
```

- Each person works on a separate branch and edits only their owned paths. A cross-folder fix goes to that folder's owner; do not perform repository-wide formatting or dependency updates.
- Each module owns its dependencies, lockfile, example environment file, fixtures, and test runner configuration. Do not create a shared backend dependency file or a shared test configuration at the repository root.
- Keep imports one-way: `backend/app` consumes the public `backend/ai` package interface; AI must not import application routes, ORM models, sessions, or frontend code. Person 2 injects persistence adapters implementing Person 3's interfaces.
- Person 3 owns AI algorithms and typed interfaces. Person 2 owns SQL persistence and database constraints, including vector tables. This avoids two contributors implementing or migrating the same database objects.
- Person 2 owns public API contract edits; Person 3 owns AI interface edits. Agree an initial version before parallel implementation. Consumers can generate local clients or keep local fixtures, but must not edit the producer's contract files.
- Coordinate changes to field names, IDs, enum values, and signatures before merging. Prefer additive changes during parallel work; the owner publishes examples with each contract change.
- The root `README.md`, `tasks.md`, root ignore rules, and any repository-level CI configuration have one coordinator: Person 2. Others put setup notes in their own module README and request any root changes through the coordinator.
- Do not commit virtual environments, model weights, local databases, credentials, or generated test output. Tests must not rewrite the shared scraped corpus.

## Task 1 — Full Frontend

**Owner:** Person 1. **Primary directory:** `frontend/front`.

Own the entire React/TypeScript/Vite frontend, including the administrator panel. Other contributors provide APIs and data, not separate frontend implementations.

### First: the complete matchmaking interface

- [ ] Build the application shell, navigation, Polish copy, and responsive layouts.
- [ ] Add selection of the synthetic user/admin demo account and connect it to the backend session mechanism.
- [ ] Build problem submission with text, anonymous presentation, and problem location from a map, manual selection, or confirmed phone location.
- [ ] Show category suggestions and allow corrections; display inferred audience, urgency, and duration as estimates.
- [ ] Show validation feedback, unsupported locations outside Małopolska, and urgent-case guidance with explicitly simulated routing.
- [ ] Present suggested canonical problems; support confirmation, rejection, and creation of a new problem when no match is suitable.
- [ ] Display up to ten matching innovations with sources, explanations, limitations, and relevant metadata.
- [ ] Implement the semantic 3D visualization using coordinates returned by the backend, with an equivalent conventional result list.
- [ ] Handle loading, processing, empty results, API failures, and retries without pretending pending work has completed.

### Then: all remaining user and administrator views

- [ ] Build the independent knowledge catalogue with categories, search, source links, and innovation details.
- [ ] Build nearby-problem discovery with a user-selected radius, distance, unique-reporter counts, and most-frequently-reported ordering.
- [ ] Build the AI idea conversation and direct idea form, including structured fields, queued processing, author confirmation, and moderation status.
- [ ] Build institution adaptation: selected innovation plus beneficiaries, location, resources, budget, and constraints; show the resulting draft.
- [ ] Build swipe cards with drag/touch, keyboard-accessible Popieram/Pomijam buttons, undo, optional rejection reasons, support counts, and lifecycle labels.
- [ ] Build idea discussion threads and in-app notifications.
- [ ] Build pilot details, resource declarations, volunteer registration/cancellation, waiting-list offers, and acceptance controls.
- [ ] Build beneficiary/volunteer satisfaction and improvement forms, distinct from support voting.
- [ ] Build the administrator panel: knowledge editing, report review, problem merge/split, duplicate-solution review/merge, idea approval, budget approval, lifecycle changes, volunteer qualification review, manual waiting-list promotion, and dissemination approval.
- [ ] Show administrator-only author identity while preserving anonymous presentation to other users.
- [ ] Apply accessible labels, focus behavior, keyboard navigation, readable contrast, and text alternatives throughout.
- [ ] Replace temporary API fixtures with real backend calls and verify all agreed journeys on desktop and mobile layouts.

**Handoff:** complete frontend consuming the shared API contract. Fixtures may unblock UI development but do not count as a working final integration.

## Task 2 — Application Backend and Workflows

**Owner:** Person 2. **Exclusive implementation directory:** `backend/app`. Integration configuration lives in `integration`, also owned by Person 2.

Own public HTTP endpoints, application authorization, all application database migrations, persistent workflow state, and integration of Person 3's packaged functions through an adapter in `backend/app`. Choose a Python framework and ORM as implementation proposals; no specific framework is mandated by the README.

### First: the complete matchmaking API

- [ ] Define the shared request/response contract with Persons 1 and 3, including errors and asynchronous processing states.
- [ ] Set up PostgreSQL, migrations, local configuration, and synthetic demo accounts.
- [ ] Implement demo sessions and enforce user/admin permissions on the server.
- [ ] Model source knowledge, reports, canonical problems, solutions, ideas, and their relations. Keep individual reports separate from canonical problems.
- [ ] Own the shared problem/solution vector table and PostgreSQL repository adapter, using Person 3's interface and index requirements. Preserve explicit entity types and stable IDs; implement vector search and geographic filtering at this boundary.
- [ ] Implement report submission, location validation, category corrections, and calls to the local sanitization and AI/matching service.
- [ ] Persist suggested associations and implement explicit confirmation or new-problem creation. Do not auto-assign low-confidence candidates.
- [ ] Count unique reporters per problem and prevent repeated submissions by one account from inflating counts.
- [ ] Expose matched innovations and 3D coordinates produced by Person 3; preserve sources and explanation fields.
- [ ] Enforce anonymous/public response projections and privileged administrator access to author identity.

### Then: stateful application modules

- [ ] Implement catalogue search/filter endpoints and geographic discovery. Keep discovery radius independent of grouping thresholds.
- [ ] Calculate frequent-problem statistics from unique reporters and geography, rather than delegating counts to an LLM.
- [ ] Implement idea states: private draft → queued AI processing → author confirmation → administrator approval → public voting.
- [ ] Own the persistent AI work queue, retries, and job-status endpoints; use Person 3's processing functions. An outage must not bypass AI processing or publication gates.
- [ ] Implement one current vote per user/solution/local-problem combination, change/undo, support counts, and eligible-card filtering.
- [ ] Implement administrator problem merge/split and solution merge, with deliberate reconciliation of associations, reporter counts, and votes.
- [ ] Implement discussion threads, institution-adaptation request storage, and in-app notifications.
- [ ] Implement pilot lifecycle transitions, resource declarations, approved budgets, unavailable status, and administrator-only pilot start/dissemination.
- [ ] Require the agreed budget, accountable owner, partners, test plan, and participants before pilot start.
- [ ] Implement volunteer capacity, cancellation, qualification review, waiting lists, place offers, acceptance, and manual promotion. Prevent oversubscription during simultaneous acceptance.
- [ ] Implement satisfaction feedback for beneficiaries/volunteers separately from support voting.
- [ ] Implement recurrence as a recommendation, never automatic deployment.
- [ ] Implement approximately one-month expiry for raw reports/conversations while retaining the catalogue, approved ideas, and active pilots. Resolve derived-data effects before deleting linked records.
- [ ] Coordinate local application/database startup and configuration documentation with Person 3; keep secrets out of the frontend and repository.
- [ ] Verify permissions, unique counts/votes, publication gates, merge behavior, pilot transitions, and waiting-list capacity with focused backend checks.

**Handoff:** working application API and persistence, including calls to the AI/retrieval service. Person 2 owns business decisions and state transitions; AI outputs never approve publication or deployment.

## Task 3 — Data, Retrieval, and AI

**Owner:** Person 3. **Exclusive AI directory:** `backend/ai`. This person also exclusively maintains the existing `backend/scrap` and `backend/data` folders; do not move them during parallel development.

Own retrieval quality and AI processing. Use local Nomic embeddings through Ollama and an external generative API, initially Gemini, behind a replaceable provider interface.

### First: existing innovations matched to a problem

- [ ] Reuse the existing scraper and Markdown corpus; inspect source metadata, category coverage, and missing text before extending ingestion.
- [ ] Define typed AI-service inputs/outputs with Person 2; avoid creating a second public application API.
- [ ] Select and document a compatible Nomic model/configuration and generative model as implementation proposals.
- [ ] Configure local embedding inference and a replaceable external generative client, including bounded calls, timeouts, and explicit failures.
- [ ] Implement local removal of identifying information before every external AI request, including reports, idea forms, conversations, and institution inputs.
- [ ] Parse and chunk source text with stable source/document/chunk IDs, provenance, and embedding-model metadata.
- [ ] Compute source embeddings and implement indexing/retrieval orchestration through the agreed vector repository interface. Person 2 implements its PostgreSQL adapter and owns schema/index migrations; Person 3 supplies vector operations and index requirements.
- [ ] Process reports into categories, audience, urgency, duration, and one generated description for the agreed HyDE embedding step. Keep generated text distinguishable from original evidence.
- [ ] Suggest existing problems using semantic similarity, context, and geographic constraints; return confidence and candidate IDs instead of silently changing associations.
- [ ] Retrieve up to ten sufficiently relevant existing innovations, considering cost, local availability, audience, and prior testing. Missing metadata must not be invented.
- [ ] Deduplicate chunk-level results into innovation-level recommendations and return source-grounded explanations and limitations.
- [ ] Produce 3D coordinates for the problem and selected solutions. Rank in the original embedding space, not by projected distance.
- [ ] Exercise retrieval with representative synthetic reports and inspect clearly irrelevant/empty results. This is a proposed engineering check, not an agreed formal benchmark.

### Then: source refresh and remaining AI functions

- [ ] Extend ingestion to the agreed publications, observatory, and challenge-map sources; extract PDF text and use OCR where required.
- [ ] Maintain the unified taxonomy and source references; inspect the supplied Social Innovation Canvas before defining its use in prompts.
- [ ] Implement daily refresh, idempotent updates, and re-embedding of changed content. Preserve the last good copy on temporary failures.
- [ ] Detect confirmed source removals and coordinate index removal with Person 2 so existing votes/pilots are not broken.
- [ ] Implement the idea assistant and direct-form refinement, returning need, beneficiaries, solution, partners, provisional costs, resources, and stages.
- [ ] Implement the institution adaptation draft from its selected innovation and supplied constraints.
- [ ] Flag similar proposed solutions for administrator review; never merge or approve them autonomously.
- [ ] Integrate retryable processing functions with Person 2's queue, without implementing a competing queue or lifecycle system.
- [ ] Document model configuration, embedding compatibility, configurable thresholds, and required environment variables. Coordinate any Ollama setup script with the agreed target platform rather than assuming one.
- [ ] Verify ingestion idempotency, temporary-failure preservation, source traceability, local sanitization, and structured-output handling.

**Handoff:** callable ingestion/AI/retrieval functions with typed results, indexed source data, and model configuration. Generated estimates remain explicitly provisional.

## Shared Contract and Integration Order

The following coordination belongs to the three tasks above; it is not a fourth task.

1. **Agree interfaces first.** Person 2 owns public API schemas in `backend/app/contracts`; Person 3 owns AI result types and persistence/provider interfaces in `backend/ai/contracts`; Person 1 validates that they cover the screens. Include stable IDs, lifecycle states, nullable estimates, source references, candidate scores, job states, structured errors, and 3D coordinates.
2. **Use one migration owner.** Person 2 writes all migrations in `backend/app/migrations`; Person 3 supplies vector/source requirements through the agreed interfaces. No migrations or application ORM models belong in `backend/ai`.
3. **Integrate the highest-priority journey early.** Person 3 returns real matches from the existing corpus; Person 2 persists the report and serves results; Person 1 submits text and renders the real recommendations. Add grouping confirmation and 3D presentation to that same path.
4. **Complete the remaining modules against shared contracts.** Frontend fixtures and fake AI responses are temporary development aids, not final functionality.
5. **Person 2 owns integration checks in `integration/tests`; all contributors investigate failures in their own modules.** Include no suitable solution, low-confidence grouping, out-of-region reports, repeated reporters/voters, anonymous presentation, AI outage with queued ideas, and administrator-only approval.

## Independent Testing

Each task must be testable without running the other two contributors' modules. The commands below are target interfaces to provide during implementation, not commands already verified to exist. Each owner documents setup in their module README.

| Owner | Test location | Independent command, from that module | Replaced dependencies |
| --- | --- | --- | --- |
| Person 1 | `frontend/front/tests`, `frontend/front/e2e` | `npm run test:unit`, `npm run test:e2e`, `npm run build` | Mock HTTP API matching the agreed public contract; no Python, PostgreSQL, Ollama, or Gemini |
| Person 2 | `backend/app/tests` | `python -m pytest tests` | Fake AI/provider boundary; dedicated disposable PostgreSQL for persistence tests; no live AI calls |
| Person 3 | `backend/ai/tests` | `python -m pytest tests` | Fake generative/embedding providers and in-memory repository; no application server, PostgreSQL, network, or API key |
| Person 3 | `backend/scrap/tests` | `python -m unittest discover -s tests -v` | Local HTML/document fixtures; no live scraping |

### Person 1 — Frontend checks

- Cover submission, grouping confirmation, empty/error/loading states, results rendering, accessible vote controls, private/public idea states, and administrator views with mocked responses.
- Include desktop and mobile browser checks. These validate UI behavior, not server authorization or real retrieval quality.
- Store frontend fixtures locally under `frontend/front/tests`; compare their shape with the producer-owned public contract.

### Person 2 — Backend checks

- Test workflow logic with an injected fake AI gateway so changes in prompts or model availability do not block application work.
- Use isolated PostgreSQL test databases for migrations, unique-reporter/vote constraints, vector adapter behavior, and concurrent waiting-list acceptance. Do not use the shared demo database or SQLite as a substitute for PostgreSQL-specific checks.
- Check server permissions, anonymity, publication gates, pilot preconditions, and merge reconciliation independently of the UI.
- Test the public API against its contract and the AI adapter against Person 3's agreed DTOs. The fake gateway must implement those same signatures.

### Person 3 — AI and ingestion checks

- Check parsing, chunking, source identity, deduplication, preservation on temporary failures, sanitization, malformed model responses, filtering, result limits, and source references with deterministic fixtures.
- Test orchestration against a fake repository implementing the agreed interface. Person 2 separately tests the real SQL adapter against the same behavior contract.
- Keep optional live Ollama/Gemini checks under a separate explicit command documented in the AI README; they may require installed models, credentials, and API spending. They must not run as part of the default offline suite.
- Treat retrieval-quality evaluation separately from unit correctness: fake embeddings cannot establish the quality of actual model recommendations.

### Integration checks after independent suites pass

- Person 2 maintains `integration/tests` and combined startup instructions. Person 1 and Person 3 supply fixes only inside their own folders.
- First run an integrated check with the actual application, AI package, disposable database, and deterministic provider substitutes to detect contract or adapter incompatibilities.
- Then verify the highest-priority journey using the real indexed corpus, local Nomic embeddings, and configured generative API. Offline mocks alone do not demonstrate working recommendations.
- Run integrated scenarios for report confirmation, recommendations, queued ideas during an AI outage, admin approval, and one-vote/one-reporter rules. Keep generated data isolated from the scraped corpus and developer databases.
- Merge the small contract/interface changes first, then independently tested module changes. Keep cross-module fixes in separate owner-reviewed changes rather than having everyone edit the integration files.

## Scope Boundaries and Open Decisions

- Do not implement real mObywatel/PESEL verification, real payments, external emergency dispatch, grant applications, external notification integrations, resumable AI conversations, or collaborative idea editing.
- Use public source descriptions and synthetic personal/demo data.
- Citizen-visible frequent-problem statistics remain an explicit deviation from the challenge document's administrator-only aggregation requirement; do not silently remove the agreed citizen view.
- **Person 1 coordinates:** accessible presentation and unresolved screen/interaction details.
- **Person 2 coordinates:** waiting-list order/offer expiry, merge reconciliation, recurrence episodes, thread visibility, satisfaction scale, counting period, and derived-data retention.
- **Person 3 coordinates:** model choices, HyDE prompt, grouping/ranking thresholds, embedding updates, source-removal evidence, and Canvas usage.
- API credentials and spending limits require the project owner's input. Keep unresolved product choices labeled as proposals; do not present them as accepted requirements.
