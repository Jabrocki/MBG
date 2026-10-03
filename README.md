# Małopolska bez granic (MBG)

Małopolska bez granic (MBG), previously known by the working name HUBMI, is a Polish-language hackathon prototype supporting the Małopolska Social Innovation Hub. It connects reported social needs with existing innovations, helps people develop new ideas, and supports community feedback and administrator-led pilots.

This README records the intended application behavior, accepted decisions, and unresolved questions. It is a product context document, not a claim that these features are implemented. The application interface is in Polish; this document is in English.

## Scope and priorities

The original citizen journey is the core scope: report a problem, confirm a suggested problem grouping, discover up to ten relevant innovations, optionally develop an idea with AI, explore nearby needs, support proposals through swipe cards, participate in approved pilots, and evaluate outcomes.

Finding existing solutions for a submitted problem is the highest priority. Social matchmaking is also the mandatory challenge module. All agreed features are intended to work in the prototype; the remaining features have no specified relative priority. Grant application generation, real payments, external system integrations, resumable AI conversations, and collaborative idea editing are outside the current scope. There are no production capacity or operational ownership commitments at this stage.

Do not include team details, a delivery roadmap, cost-of-operation estimates, acceptance criteria, or a demo scenario in this README.

## Current repository

- `frontend/front`: React, TypeScript, and Vite frontend with 45 interactive MBG mockup screens and a review atlas; see [mockup documentation](frontend/front/mockups/mbg-v4/README.md). These use local fixtures and do not implement backend sessions or AI.
- `backend/scrap`: Python/Scrapy innovation-library scraper; see its README for usage.
- `backend/data`: scraped innovation descriptions in Markdown.

The scraper documentation describes extracting descriptions, categories, metadata, and links. It does not describe downloading linked PDFs, archives, or videos. The broader ingestion and application behavior below remains intended scope rather than verified implementation.

## Users and access

There are two application roles: user and administrator. All application features require login. An informational public landing presents the initiative before login; the catalogue and application data remain behind the intended session boundary. Prototype accounts, reports, and locations are synthetic. There is no mObywatel integration, PESEL-based authorization, or real identity verification in the prototype; this supersedes earlier identity-integration ideas.

Users may report issues affecting themselves, other people, organizations, or communities. An institution-oriented journey is available under the user role rather than a separate verified institutional role.

The prototype uses two synthetic demo accounts, user and administrator, selectable without a production authentication flow. Anonymous reporting hides the author from other users, while the administrator can see the synthetic author identity.

## Sources and ingestion

The intended knowledge sources are:

- [ROPS Social Innovation Library](https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/kategorie).
- [Publications from the world of innovation](https://rops.krakow.pl/innowacje-spoleczne/publikacje-ze-swiata-innowacji).
- [Małopolska social policy observatory](https://obserwator.rops.krakow.pl/).
- [Map of Social Challenges](https://rops.krakow.pl/mpliki/IS/IWS_20/za._nr_2._Mapa_Wyzwa_Spoecznych.pdf).
- [Social Innovation Canvas](https://rops.krakow.pl/mpliki/IS/Moj_folder/INNO_AGH_-_SOCIAL_CANVAS.pdf), supplied as a reference; its contents have not yet been verified in this session.

Refresh sources daily. Extract and chunk text; apply OCR to scanned documents. Only text is indexed. Media links may remain available as source references. A unified taxonomy spans the source material and citizen reports.

Remove source material from the active indexed dataset only after confirmed removal. Keep the last successful copy during temporary timeouts, access denials, or server failures. Handling innovations with existing votes or pilots after confirmed source removal remains unresolved.

## Technology and AI boundary

- Frontend: React, TypeScript, Vite.
- Backend: Python; framework and ORM are not selected.
- Storage: one PostgreSQL database, with separate logical tables and vector support. Extensions are permitted; containerization is acceptable.
- Embeddings: a local Nomic embedding model, with Ollama as the intended local runtime. Exact model tag and embedding configuration remain open.
- Generative AI: an external API for classification, text refinement, aggregation assistance, HyDE, estimates, and the idea assistant. Gemini API is accepted as the initial provider; the integration must support replacement through a provider boundary. The exact generative model remains open.

The latest decision supersedes the earlier proposal to run all AI locally. Only embeddings run locally. API credentials, the exact generative model, and API spending limits remain unresolved; free generative inference must not be assumed.

Use the same compatible embedding model and configuration for indexed and query text. Model changes require an explicit re-embedding strategy. Generative AI outputs are suggestions and estimates, not administrator decisions.

## Data organization

Use one database with separate logical stores for:

- Source knowledge and text chunks, including provenance.
- Individual reports, including their links to a canonical problem.
- Canonical problems and solutions in a shared vector-search collection, with explicit entity types so they can be compared without confusing their meanings.
- New ideas, distinct from source-backed solutions until their lifecycle and publication decisions allow further use.

A common vector collection does not replace relational records for users, votes, moderation, pilot stages, and participation.

When creating a new problem, generate one description from the first report through the agreed HyDE step and embed that description. Use a single generated description rather than multiple generated variants. The exact prompt and whether subsequent confirmed reports update the representation remain implementation details to settle. Preserve the original report separately from generated text, subject to the retention policy, so generated information is not treated as an observed fact.

## Reporting and grouping problems

1. The user submits text and the location of the problem. Location comes from a map, manual entry, or phone geolocation confirmed as the problem location.
2. AI estimates categories, target audience, urgency, and duration. Reports may have multiple categories, and users may correct the categorization.
3. Unsuitable text receives an explanation and a request to revise it.
4. AI and text similarity suggest an existing canonical problem, considering geographic proximity and contextual relevance.
5. The user confirms the suggested association. Low-confidence matches are not assigned automatically. Rejecting all suggestions creates a new problem.
6. A new problem is visible immediately, initially with one reporter, and remains subject to ongoing administrator moderation.

Only problems in Małopolska are accepted. The user selects the discovery radius, independently of the radius used to group reports. Changing a discovery filter must not change problem grouping. Cross-municipality grouping depends on geographic proximity. Geographic and similarity thresholds will be configurable; initial values are to be proposed and checked against sample data rather than treated as agreed constants. Boundary handling remains open.

Count unique reporting users per problem. Repeat submissions by the same user count once. Administrators can merge or split grouped problems. Reconciliation of counts, votes, and existing user associations after such actions must be specified.

For recurrence of a previously resolved problem, automatically recommend the highest-rated suitable innovation and allow case-specific voting. Recommendation does not start implementation: another deployment still requires administrator approval. Episode boundaries and the scope of the historical rating remain open.

For urgent cases, the prototype displays contact guidance and a clearly labeled simulated routing status. It does not contact emergency services or imply that a real notification was sent. Exact guidance and destinations remain to be defined.

## Matching and presentation

Users can independently browse a knowledge catalogue of innovations and materials, explore categories, and search without submitting a problem. Login is still required.

Show up to ten sufficiently relevant innovations. Do not fill the result list with poor matches. Consider semantic/textual similarity, cost, local availability, target audience, and evidence of prior testing.

Each result includes its source, an explanation of the match, and relevant limitations. Ranking weights and minimum relevance thresholds remain open.

Use full embeddings and applicable filters for ranking. A reduced-dimensional 3D view visualizes semantic proximity between the problem and its candidate solutions; it is not a geographic map and does not determine ranking. Projection distances are approximate. Provide a conventional result list alongside the 3D visualization.

Retrieval automatically identifies candidate source material; generation can explain or summarize it. Automatic retrieval does not guarantee relevance. Sample problems can be used to check matching quality without manually matching every user report. No evaluation dataset or evaluation procedure has yet been agreed.

## Nearby needs and trends

A separate view shows how often a problem has been reported and how close it is to the user's chosen area. It offers entry to the idea assistant.

Grouping uses AI and text similarity. The prototype's trends view means the most frequently reported problems in the selected area, ranked algorithmically by unique-reporter count. It does not measure growth over time. The counting period remains open.

Both administrators and users are intended to see relevant statistics. This is a deliberate departure from the challenge document's restriction of aggregated needs and trend analysis to administrators. The product decision is retained; this README does not claim full compliance with that restriction.

## Idea creation and AI assistant

Users can propose ideas directly or enter a conversation when existing solutions do not meet their needs. The assistant conducts a conversation and produces a draft. Resuming previous conversations and collaborative editing are outside scope.

The structured result covers:

- Need and intended beneficiaries.
- Proposed solution.
- Partners.
- Costs and resources.
- Implementation stages.

Directly entered ideas also pass through AI text refinement for readability and clarity. AI-generated cost estimates are provisional; an administrator approves a cost based on a prepared budget.

If the AI API is unavailable, a form is the primary fallback. A submitted idea waits in a processing queue instead of being published immediately. Author approval cannot bypass AI processing or send the unprocessed idea directly to the administrator for publication.

The agreed publication flow is: form or conversation → AI-refined text → author confirmation → administrator approval → public card and voting. A draft can be stored before approval but remains private. Being stored or published as an idea does not mark it as a tested innovation.

## Community support and swipe cards

Cards present relevant local or region-wide proposals for existing unresolved problems. Swipe right means support. Users can undo a choice and optionally explain rejection. Desktop interaction uses mouse dragging; mobile interaction uses touch dragging. Equivalent keyboard-accessible buttons labeled Popieram and Pomijam are also required.

Eligible cards must be administrator-approved. New ideas are ordered by the number of supports within the eligible relevant set. Cards distinguish proposed ideas, solutions being tested, and established innovations with a visible annotation.

Similar solutions are flagged for administrator review and possible merging. Independently of duplicate detection, allow only one current vote per user for a solution in a specific local problem. Users can change or withdraw it. Popularity means support count, not a positive-rating percentage or post-pilot satisfaction score. Tie-breaking, popularity across local deployments, and vote reconciliation after merging remain open.

## Moderation, pilots, and resources

The accepted lifecycle is:

`Draft → Review → Recruitment / Funding → Pilot → Evaluation → Dissemination`

Recruitment and funding may need to run together; exact transition rules remain open. Administrators approve drafts, recruitment, funding, pilot start, and dissemination. They also maintain knowledge, review reports and ideas, and handle duplicate suggestions.

Support can include budget declarations, volunteer time, equipment, and premises. No real payments are included at present. A future payment feature requires a separate scope decision.

A pilot requires an approved budget, an accountable owner, required partners, a test plan, and sufficient participants. The administrator makes the final start decision. When resource or funding conditions fail, an administrator can mark the initiative unavailable; pause, cancellation, and recovery behavior require clarification.

## Volunteering and evaluation

Volunteer registration is open, with optional capacity limits, dates, and waiting lists. Where skills are required, an administrator confirms them. Only synthetic evidence is appropriate for this prototype; no real document scans or mObywatel verification are included.

A cancellation frees a place for a waiting volunteer. Notify the selected volunteer inside the application and provide a button to accept the available place. An administrator can also move a volunteer from the waiting list manually. External notification channels remain outside scope. Offer expiry, waiting-list ordering, and handling competing acceptances remain implementation details to settle.

Beneficiaries and volunteers rate satisfaction with the innovation, provide feedback, and suggest improvements. Administrators approve dissemination. Rating scales, timing, eligibility, and the relationship between satisfaction and public popularity remain open.

## Communication and institution journey

Communication takes place in threads attached to ideas. This is intended to support dialogue with administrators and other participants; audience, visibility, and expert participation need clarification.

A separate user journey adapts an existing innovation into a service for an institution's needs. The institution supplies its beneficiaries, location, resources, budget, and constraints. The output is a draft adaptation of the selected innovation. No additional verified institution role is introduced.

## Privacy and retention

Use public innovation descriptions and synthetic accounts, reports, and locations for the prototype. Anonymous public presentation must be distinguished from authenticated submission.

Remove identifying information locally before sending text to any external AI API. Retain the problem location and target group for matching. The moderation order is then AI processing followed by administrator review. Location and target-group combinations must not be assumed anonymous by default.

Retain raw reports and conversations for approximately one month. Keep the innovation catalogue, approved ideas, and active pilots beyond that period. Exact expiry scheduling and treatment of derived embeddings, canonical problem summaries, unique-reporter counts, and votes after raw-report deletion remain implementation details to settle.

## Challenge alignment and explicit gaps

Reference: `CRITERIA Wojewodztwo Malopolskie HUBMI.pdf`, supplied by the project owner.

- Social matchmaking is mandatory and central to this concept.
- The challenge describes six additional modules: knowledge resources, idea creation, innovation testing, active communication, administration, and institution-specific innovation adaptation. Their implemented breadth determines coverage; this README does not claim completed modules.
- Public aggregation/trends intentionally differ from the administrator-only requirement on page 3.
- The grant application generator is explicitly deferred. Use of the supplied Social Innovation Canvas still needs definition.
- An independently browsable knowledge library is in scope, including categories and search without first submitting a problem.
- The challenge targets WCAG 2.1 AA. Equivalent keyboard-accessible voting buttons and a conventional list alongside the 3D view are agreed requirements. These decisions alone do not establish full accessibility conformance.
- NGO, municipality, and expert needs are represented, if at all, through the user role. Their detailed journeys are incomplete.
- External notification and integration functionality is deferred. In-app waiting-list notifications, acceptance of an offered place, and manual administrator promotion are in scope.
- Formal submission materials and operating-cost estimates are required by the challenge but intentionally excluded from this README at the user's request. They have not been produced by this documentation task.

## Decisions still required

1. Exact Nomic model, Gemini model, credentials, and API spending limit. No Ollama setup script has been requested definitively or created; installation method and target operating systems are undecided.
2. Proposed geographic and similarity thresholds, ranking weights, boundary handling, and recurrence episode rules.
3. Exact prompt for the single generated description used by the HyDE step, and representation updates after additional reports.
4. Popularity across local deployments, tie-breaking, and deduplication of votes and reporters after merging.
5. Waiting-list ordering, offer expiry, and handling competing acceptances.
6. Treatment of already-referenced innovations after confirmed source removal.
7. Retention expiry scheduling and treatment of derived data after deleting raw reports or conversations.
8. Detailed use of the supplied Social Innovation Canvas.
9. Satisfaction scale, feedback timing, counting period for frequent problems, and communication-thread visibility.
10. Sample-based checking of retrieval quality, if included in subsequent development work.

Any proposed defaults for the remaining open decisions must remain labeled as proposals until accepted.
