# Assessment design and learner skill modeling for an interactive faraidh app (skill profile radar + "jaring")

Scope note: researched with web search and a few full-text reads (Pelánek's UMUAI overview, mastery-criteria paper, Elo/decay paper, Kaliisa et al. LAD review, read as extracted PDF text). Most other items are from search snippets/abstracts only; flagged where not verified at full-text level.

## 1. Knowledge components, Q-matrix, step-level tagging of multi-step problems

### Takeaway
Treat each pipeline stage (identify heirs, hajb, fardh, ashl, 'aul/radd, tashih, nominal) as a graded step, and tag each step (not the whole problem) with one or a few knowledge components (KCs), recorded as a Q-matrix (step x KC). Step-level KC mapping is the standard Cognitive Tutor / KLI practice and fits generated problems well, because the engine already computes each step's key.

### Cited Findings
- KLI framework (Koedinger, Corbett, Perfetti 2012, Cognitive Science 36(5):757-798) defines a knowledge component as a stable, modifiable unit of cognitive function that cannot be observed directly, only inferred from assessment performance. — [CMU KiltHub record](https://kilthub.cmu.edu/articles/journal_contribution/The_knowledge-learning-instruction_framework_bridging_the_science-practice_chasm_to_enhance_robust_student_learning_/6470522); draft PDF: [KLI paper v5.00](https://home.cs.colorado.edu/~mozer/Teaching/syllabi/TopicsInCognitiveScienceFall2011/KLI-paper-v5.00.pdf) (search summary; not read at full text)
- A Q-matrix is a binary table mapping steps/items to KCs: Q[k][j]=1 if step j applies KC k; used by cognitive diagnosis models (DINA, NIDA) and by logistic KT models such as PFA/IFA. — [Chi et al. IFA/AFM/PFM/IFM paper](https://www.stat.cmu.edu/~brian/nynke/726-2021/project%20HCI%20Prereqs%20(Elaine,%20Smeet%20&%20Zhou)/2021-03-02/chi-etal-ifa-AFM-PFM-IFM.pdf) (snippet-level; the KLI paper itself was not confirmed to define Q-matrix)
- Pelánek (2017) argues KLI should guide learner-model choices: KC types (facts, categorization, procedures, principles) and learning processes (memory/fluency; induction/refinement; understanding/sense-making) imply different models and item designs. He states the KC granularity/scope are choices needed even with "simple" models. — [Pelánek, UMUAI overview (PDF)](https://www.fi.muni.cz/~xpelanek/publications/umuai-overview.pdf) (read at full text)
- Pelánek: it is easier to use "multiple KCs per item" with logistic models than with BKT; and with simple adaptive item choice a misspecified KC matters less for models without learning assumptions (e.g. moving average). — [same](https://www.fi.muni.cz/~xpelanek/publications/umuai-overview.pdf)
- Pelánek notes confounding: if all learners see items in a similar order, learning cannot be separated from rising item difficulty; adaptive/personalized ordering removes it but creates a model-evaluation feedback loop. — [same](https://www.fi.muni.cz/~xpelanek/publications/umuai-overview.pdf)
- Hierarchical Elo extensions exist for item/KC hierarchies (Nižnan et al. 2015b), cited in the same overview. — [same](https://www.fi.muni.cz/~xpelanek/publications/umuai-overview.pdf)

### Inferences
- Suggested KC grain for faraidh: one KC per pipeline stage x rule family (e.g. HAJB_HIRMAN, HAJB_NUQSHAN, FARDH_ZAWJ, ASHL_TAMATSUL/TADAKHUL..., AUL, RADD_TANPA_ZAWJ, TASHIH_INKISAR, NOMINAL_PEMBULATAN), 20-40 KCs total for v1. Because problems are generated from pattern + seed, the pattern id gives a free deterministic Q-matrix row: the engine trace (LangkahJejak) already records which rules fired, so Q can be derived automatically from the trace rather than hand-labelled (my design inference, not a cited practice).
- Each step is graded independently, but a wrong early step contaminates later steps (e.g., wrong heir set makes ashl wrong). Grade later steps conditional on the learner's own earlier answer ("follow-through" grading) where the engine can recompute; otherwise only count a later step as evidence when earlier steps were correct. No source found stating a standard for this in ASSISTments/Cognitive Tutor; marked as a gap.
- Two-level tagging helps the "jaring": KC (fine, estimated) rolls up to topic/skill axis (coarse, shown in radar), and KC prerequisite edges give the web.

### Gaps
- Did not retrieve primary text on Cognitive Tutor/ASSISTments step-level credit assignment and how multiple-KC steps are credited (conjunctive vs compensatory); no verified source.
- No empirical evidence found on an optimal KC count per domain or how many observations per KC are needed for stable estimates.

## 2. Mastery estimation from answers

### Takeaway
For a small team and low data: start with a per-KC exponentially weighted moving average or Elo-style update plus an N-in-a-row/threshold rule for "mastered"; add BKT/PFA only when real logs exist and a use for the added interpretability emerges. Pelánek explicitly recommends simple models unless there's a clear reason otherwise.

### Cited Findings
- Pelánek (2017, UMUAI): "it is typically better to have a simple implementation of all important components than a very sophisticated model of learning, but poor implementation of an instructional policy and missing an open learner model"; from developers' perspective preferable to use simple models unless there is a clear reason. — [UMUAI overview](https://www.fi.muni.cz/~xpelanek/publications/umuai-overview.pdf)
- Simple moving-average / exponential moving average (past attempts weighted by exponentially decreasing function) "often provide reasonable predictions" and have ease of application and computational efficiency; absence of learning assumptions can reduce impact of misspecified KCs. — [same](https://www.fi.muni.cz/~xpelanek/publications/umuai-overview.pdf)
- Model families: BKT (binary known/unknown latent state per KC; parameters initial-learned, learn, guess, slip), logistic models (PFA, AFM, IFA, Elo), mixtures; complex ML (collaborative filtering, ensembles, RNN/DKT) often achieve good prediction "at the price of poor interpretability". — [same](https://www.fi.muni.cz/~xpelanek/publications/umuai-overview.pdf)
- Pelánek's hypotheses (explicitly "not sufficient evidence"): logistic models better for fluency/memory processes, BKT better for understanding/sense-making; forgetting matters strongly for fluency/memory but only slightly for understanding; for mastery detection, the data used matters more than model details. — [same](https://www.fi.muni.cz/~xpelanek/publications/umuai-overview.pdf)
- BKT treats knowledge as binary and handles uncertainty but not degrees of knowledge; logistic models capture degrees but not uncertainty systematically; Pelánek proposes a generalizing model. N-consecutive-correct criterion trades over-practice vs premature mastery declaration. — [Pelánek, Conceptual Issues in Mastery Criteria (PDF)](https://www.fi.muni.cz/~xpelanek/publications/mastery-modeling.pdf) (read at full text)
- Elo for learners: skill update theta := theta + K(R - P(R=1)) with P = 1/(1+e^-(theta - difficulty)); with a constant K it equals an exponentially decaying weighted average of per-attempt local skill estimates (theta_s = K * sum (1-K)^(n-i) theta_sp,i); uncertainty-dependent (steeper decay early, flatter later) K is recommended. — [Pelánek, time decay functions and Elo (PDF)](https://www.fi.muni.cz/~xpelanek/publications/decay-elo.pdf) (read at full text)
- Elo basic variant "provides useful estimates" for prior-knowledge estimation on geography data (2015 EDM comparison, abstract-level). — [EDM 2015 poster](https://www.educationaldatamining.org/EDM2015/proceedings/poster560-561.pdf) (snippet only)
- A 2024 study found Elo accuracy comparable to logistic regression predicting final exam outcomes on a medical training platform. — [arXiv 2403.07908](https://arxiv.org/html/2403.07908v1) (snippet only)
- PFA (Pavlik, Cen, Koedinger, AIED 2009) adapts Learning Factors Analysis for per-student per-skill tracking (counts of prior successes and failures per KC), as an alternative to BKT. Later papers treat it as a competitive standard; a recency-weighted "Recent-PFA" variant exists. — [PFA record](https://researchr.org/publication/PavlikCK09); [Recent-PFA](https://arxiv.org/pdf/1501.02732.pdf) (abstract-level)
- Wilson et al. (EDM 2016): IRT-based models (incl. hierarchical Bayesian IRT) matched or beat Deep Knowledge Tracing on all tractable datasets; DKT comparison limited by tractability at fine granularity. — [arXiv 1604.02336](https://arxiv.org/pdf/1604.02336.pdf) (abstract-level)
- pyBKT (Badrinath, Wang, Pardos, EDM 2021) is an MIT-licensed Python library (pip, scikit-learn-style API) with fit/predict/cross-validate; Python-only (pure or C++), so using it implies an offline fitting job, not in-browser TS. — [pyBKT paper](https://arxiv.org/pdf/2105.00385); [PyPI](https://pypi.org/project/pyBKT/)
- Khan Academy mastery levels (Attempted/Familiar/Proficient/Mastered): rule-based thresholds on exercise/quiz/test performance (e.g. 70-85% -> Familiar; all correct from Familiar -> Proficient; all correct on unit test -> Mastered; 100% on first attempt can jump two levels; Mastered can drop two levels if <70%). — [Khan Academy support: Mastery levels](https://support.khanacademy.org/hc/bg/articles/5548760867853)
- Khan Academy's own analysis: better to reach at least Proficient on fewer skills than Familiar on many ("skills to proficient"). — [Khan Academy blog](https://blog.khanacademy.org/?p=13201) (search summary)

### Inferences
- With deterministic engine-graded steps, each step outcome is a clean 0/1 (or partial credit) observation; this is the best-case data for Elo/EMA. Item difficulty can come from the pattern (number of heirs, presence of 'aul/radd/inkisar) instead of being learned from data, which removes the biggest cold-start burden of Elo/IRT (my inference).
- Cold start: initialise each KC at a neutral prior (e.g. 0.3-0.5) with high uncertainty (large K), optionally seeded by a short placement quiz; show "belum cukup data" until >= n observations (n ~ 3-5 is an assumption; no source gives a faraidh-specific figure). Pelánek's separation of degree vs uncertainty maps to showing a bar (degree) plus a faded/hatched confidence (uncertainty).
- Forgetting: for conceptual/rule KCs the cited hypothesis says forgetting matters little; for calculation fluency (ashl LCM, tashih) it matters more. A cheap approach is exponential time decay on the evidence weight or a "last practiced" badge rather than a full memory model. No source tested this in faraidh.
- Storage in Supabase: an append-only `step_attempt(user, kc, correct, pattern, seed, ts)` table is the single source of truth; the estimate can be recomputed (view or function) from it, so the algorithm can be swapped later (BKT/PFA/IRT) without data migration.

### Gaps
- No published faraidh/inheritance-specific learner-model data.
- No source for the minimal number of observations per KC for a reliable estimate; depends on slip/guess rates.
- Did not fetch the original Corbett & Anderson 1995 BKT paper; BKT parameter semantics come from Pelánek's overview.
- Wilson et al., Elo, PFA findings only at abstract/snippet level.

## 3. Knowledge Space Theory, prerequisite graphs, adaptive placement

### Takeaway
KST/ALEKS models a learner state as a set of mastered items constrained by prerequisite structure; the "outer fringe" (ready to learn) and "inner fringe" are the actionable outputs. A full KST implementation needs a validated prerequisite structure plus large assessment data; a light version (prerequisite graph over KCs used to decide "ready next" and to detect gaps) is feasible.

### Cited Findings
- Outer fringe = items not in the state that can be added while staying a valid state ("ready to learn"); inner fringe = items in the state that can be removed (most advanced competencies); in a learning space a state is determined by its two fringes. — [Falmagne/Doignon synthesis via Wikipedia: Knowledge space](https://en.wikipedia.org/wiki/Knowledge_space); [arXiv 1511.06757 Knowledge Spaces and Learning Spaces](https://arxiv.org/pdf/1511.06757) (search summaries)
- ALEKS is a KST-based system; its authors tested the predictive validity of the outer fringe on hundreds of thousands of assessments. — [ALEKS: assessing the learning space (McGraw Hill PDF)](https://www.mheducation.com/content/dam/mhe/research/prek-12/essa-tier-4/aleks-assessing-learning-space.pdf) (snippet; specific success rates not retrieved)
- Origin: Doignon & Falmagne 1985, "Spaces for the assessment of knowledge", Int. J. Man-Machine Studies; book Knowledge Spaces (1999). — [arXiv 1511.06757](https://pdf.arxiv.org/pdf/1511.06757)

### Inferences
- A faraidh prerequisite graph is largely given by KB pipeline order (heirs -> hajb -> fardh -> ashl -> 'aul/radd -> tashih -> nominal) and by case dependencies (e.g. ashabah bil ghair needs fardh basics). Use as a DAG over KCs: "jaring" edges = prerequisite; node colour = mastery estimate; "ready next" = KC whose prerequisites are all above threshold and itself is not (a lightweight outer-fringe analogue). This is a design inference; not validated like ALEKS.
- Since the pipeline is fixed, a short adaptive placement can walk the DAG (test a mid-chain KC; if correct, skip earlier; if wrong, step back), inferred from KST logic; accuracy untested.

### Gaps
- No source on lightweight (non-KST-validated) prerequisite graph accuracy or placement-test length needed.
- Did not open primary KST texts or ALEKS success-rate numbers.

## 4. Visualization to learners and teachers

### Takeaway
Radar charts are perceptually weak (position on common scale beats angle/area; shape depends on axis order; area is nonlinear), so show a sorted bar/dot plot (or small multiples) as the primary view and, if a radar is still wanted for identity/"profile feel", keep few fixed axes in a stable meaningful order with values labelled. LADs/OLMs have weak evidence for improving achievement and carry demotivation/comparison risks, so default to private, growth-framed, optional comparison.

### Cited Findings
- Radar chart critiques: area grows faster than values (exaggerates differences); shape changes with axis order; connecting categories with lines contradicts a basic rule; viewers mostly perceive only similarity and extreme outliers. — [Scott Logic critique](https://blog.scottlogic.com/2011/09/23/a-critique-of-radar-charts); [Observable: avoid radar charts](https://observablehq.com/blog/avoid-radar-charts) (search summaries; practitioner blogs, not experiments)
- Alternatives: radial bar (independent bars, order doesn't distort), stellar chart (tapering bars with independent scales), simple/faceted bar charts; the alternatives have limitations too. Counterpoint: radars suit comparing several numeric variables across 2+ items. — [Significance: off the radar](https://significancemagazine.com/off-the-radar-here-are-some-alternatives/); [Nightingale: stellar chart](https://nightingaledvs.com/the-stellar-chart-an-elegant-alternative-to-radar-charts/); [Flourish](https://flourish.studio/blog/create-online-radar-spider-charts/)
- Cleveland & McGill: position along a common scale is the most accurately judged task, then position on non-aligned scales, length, angle, area; Heer & Bostock's crowdsourced replication largely confirmed; Davis et al. argue the ranking is only the most common, with individual differences. — [Cornell INFO3312 graphical perception notes](https://info3312.infosci.cornell.edu/ae/graphical-perception-A.html); [Davis et al.-related SAGE](https://journals.sagepub.com/doi/10.1177/14738716241259432) (search summaries)
- Skill meters (OLM): filled proportion of a bar shows level of understanding; Bull, Brusilovsky, Guerra, Araujo study individual vs peer/group comparison skill meters; learners vary in preferences for OLM visualisations. — [Bull et al. (CORE PDF)](https://core.ac.uk/download/85137024.pdf) (snippet; results not retrieved)
- Guerra, Schunn, Bull et al. 2018: controlled study of six OLM visual designs for navigation in complex OLMs; strategic summary elements improve expressiveness. — [Guerra et al. 2018 PDF](https://www.lrdc.pitt.edu/Schunn/papers/guerra-et-al2018.pdf) (snippet)
- Bodily, Kay et al. 2018 review of OLMs vs LADs: ~60% of new OLMs rely on a single data type, 33% behavioural metrics, 39% allow user input, 37% complex models, 6% multiple applications. — [LAK 2018 record](https://dx.doi.org/10.1145/3170358.3170421); [TU Delft repository](https://repository.tudelft.nl/record/uuid:6ddc2565-0cd8-42a9-b09b-6ef40ba143c3) (abstract-level)
- Matcha, Uzir, Gašević, Pardo (IEEE TLT 13(2), 2020): LADs are rarely grounded in learning theory, rarely support metacognition or give information about effective learning tactics; proposes MULAS (theory, design, feedback, evaluation); about 29 papers 2010-2017. — [Adelaide record](https://digital.library.adelaide.edu.au/items/6cb25a66-ac4c-43b5-b12c-d57be8cd9c81) (abstract-level; the "2019" date: IEEE record lists 2020, copyright 2019)
- Kaliisa et al. (38 studies): no evidence LADs improved achievement; most effects negligible/small; modest motivation/attitude effects; relatively substantial impact on participation; methodological issues (self-selection, "access equals usage", small samples). — [Kaliisa et al., arXiv 2312.15042](https://arxiv.org/pdf/2312.15042) (read at full text, abstract and tables)
- Insufficient evidence that open learner modelling improves self-awareness (2020 study cited); combining peer models in ways that promote positive competition without social pressure "still need to be explored". — [Springer s41039-020-00137-5](https://link.springer.com/10.1186/s41039-020-00137-5) (snippet)
- Pelánek: open learner model is one of the key links ("weakest link" argument); don't overbuild the model while skipping the OLM. — [UMUAI overview](https://www.fi.muni.cz/~xpelanek/publications/umuai-overview.pdf)

### Inferences
- Because Bull's 2020 review was not found (see Gaps), cite Bodily et al. 2018 and Matcha et al. for review-level evidence.
- Recommended learner view: per-skill horizontal bars on a common 0-100 scale with uncertainty shown (faded bar or "belum cukup data"), sorted by pipeline order (stable meaning) rather than by score; one-line next action per weak skill. A radar, if used, should be a secondary "profile" widget with fixed pipeline-order axes, labelled values, <= ~6-8 axes (axis count threshold is my inference).
- Teacher view: class heatmap (rows students, columns KC) with filters; avoid ranking students on a leaderboard by default. Peer comparison, if offered, opt-in and framed as class distribution not rank (inference from the social-pressure caveat, not an experimental result for this app).
- Jaring: node-link DAG with KC nodes coloured by mastery, outer-fringe nodes highlighted; the evidence found is on OLM navigation/skill meters, not on concept-map-style learner graphs specifically (gap).

### Gaps
- Could not locate the "Bull 2020" OLM review the brief mentions; search returned Bodily et al. 2018, Bull-Kay 2013 chapter and Bull-Brusilovsky-Guerra work instead. Needs author-site check.
- No controlled study found comparing radar vs bar for skill profiles in education specifically; evidence is generic graphical-perception research and practitioner critique.
- No retrieved evidence on knowledge-graph/concept-map displays as learner-facing mastery visualisations.
- Specific demotivation/social-comparison effect sizes not extracted from Kaliisa et al. (grep for these terms found only anxiety-related items).

## 5. Comprehension quiz design inside lessons

### Takeaway
Use short, targeted checks at lesson hinge points: multiple-choice items whose distractors map to known misconceptions, optionally two-tier (answer + reason), plus error-finding on worked solutions; keep feedback specific to the chosen distractor. Evidence for erroneous examples is positive but mixed and costs more confusion/frustration.

### Cited Findings
- Hinge questions (Wiliam): diagnostic questions at a decision point to check understanding before moving on; each wrong option should target a specific misconception, aim to elicit the right response for the right reason; implausible distractors collapse the item into a guess; answering should take about 1-2 minutes. — [Wiliam, Designing Great Hinge Questions (ASCD)](https://ascd.org/el/articles/designing-great-hinge-questions); [Chartered College](https://my.chartered.college/?p=3482) (search summaries; ASCD article not read in full; some blog claims unverified)
- Two-tier diagnostic tests (Treagust 1988, IJSE 10(2):159-169): tier 1 content answer, tier 2 reason; development steps = define content, identify student conceptions, write two-tier items; second tier options derive from student justifications (Tamir 1989). — [Treagust 1988 via SMEC/DCU](https://www.dcu.ie/sites/default/files/smec/pdfs/P3%20SMEC%202008%20Treagust.pdf); [Sydney IISME](https://openjournals.library.sydney.edu.au/IISME/article/view/17447) (search summaries; original not read)
- Confidence-based marking (Gardner-Medwin): confidence 1/2/3, marks 1/2/3 if correct, penalties 0/-2/-6 if wrong, designed so honest confidence maximises score; evidence for reliability/validity and learning benefit is largely from the developer; no independent controlled learning-gain study found; strong students can lose through diffidence. — [Physiological Society: CBM](https://www.physoc.org/?p=55824); [Moodle docs: certainty-based marking](https://docs.moodle.org/503/en/Using_certainty-based_marking)
- Erroneous examples (find/explain the error in a worked solution): Booth, Lange, Koedinger, Newton (2013, Learning and Instruction 25:24-34) found incorrect examples as effective as correct ones for algebraic feature knowledge, and correct+incorrect combos linked to better conceptual understanding; mixed/null results elsewhere; Richey et al. 2019: more confusing and frustrating. — [LearnLab Booth page](https://learnlab.org/research/wiki/index.php/Booth); [Relevant literature (CMU)](https://www.cs.cmu.edu/~bmclaren/projects/AdaptErrEx/literature.html); [editlib: More confusion and frustration, better learning](https://mail.editlib.org/p//209945) (snippet-level)

### Inferences
- Faraidh-specific misconception candidates for distractors come from the engine itself: run the pipeline with a deliberately wrong rule (skip hajb, treat radd as including zawj, apply 'aul when not needed, don't tashih) to generate distractors automatically, each tagged with the misconception KC. That gives "two-tier-like" diagnostics from one tier, without writing reasons (my design inference).
- Items per check: sources give ~1-2 min per hinge question, i.e. 1-3 items per lesson checkpoint; no cited source gives an evidence-based number of items per KC. Keep embedded checks light (1-3 items, a single most important KC) and put the profile-feeding volume in generated practice.
- Embedded checks should write to the same `step_attempt` table but with lower evidence weight than generated practice (design suggestion; confidence-tagged answers could weight evidence higher, but the CBM evidence is thin).

### Gaps
- No empirical source found for optimal items per comprehension check or the best feedback format; "explain why" free-text items were not researched (grading cost high; would need rubric or LLM, outside deterministic engine).
- Original Wiliam, Treagust, and Gardner-Medwin papers not read in full.

## 6. Privacy and ethics of skill profiling (brief)

### Takeaway
Not researched with sources in this pass; treat as design constraints to verify.

### Cited Findings
- Kaliisa et al. note recurring "assumption that access equates to usage" and self-selection issues, which cautions against over-reading dashboard-derived metrics. — [arXiv 2312.15042](https://arxiv.org/pdf/2312.15042)
- Matcha et al.'s MULAS includes an evaluation dimension and calls for theory-grounded design. — [Adelaide record](https://digital.library.adelaide.edu.au/items/6cb25a66-ac4c-43b5-b12c-d57be8cd9c81)

### Inferences
- Minimum practical measures (not from a cited source): learner owns/can delete their data; profile private by default; teacher view only through explicit class membership; no leaderboards by default; label estimates as estimates with uncertainty; for minors, check Indonesian law (UU PDP 27/2022) and parental consent. These legal points were not verified here.

### Gaps
- No sources retrieved on privacy/ethics of learner profiling, UU PDP applicability, or fairness of skill estimates.

## Practical bottom line (all inferences, for the report writer)
1. Log every graded step as (user, kc, correct, pattern, seed, time); derive KC tags from the engine trace; keep the estimator replaceable.
2. v1 estimator: per-KC Elo/EMA with uncertainty-dependent K, difficulty from pattern features, "mastered" rule = threshold plus N consecutive correct (Khan-style levels as UI vocabulary); "belum cukup data" under min observations.
3. v2 (when logs exist): fit PFA or IRT/BKT offline (pyBKT is Python) and compare against v1 on held-out prediction.
4. UI: sorted bars with uncertainty as primary, optional radar as secondary, DAG "jaring" with prerequisite edges and a "ready next" highlight; teacher heatmap.
5. Quizzes: 1-3 hinge items per checkpoint, engine-generated misconception distractors, occasional error-finding worked examples.
