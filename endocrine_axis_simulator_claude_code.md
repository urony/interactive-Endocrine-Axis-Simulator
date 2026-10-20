# Claude Code Prompt — Interactive Endocrine Axis Simulator

## 1. Project Goal

Build a complete, visually engaging, interactive educational simulator for Israeli high-school Health Sciences students (Grade 11).

The simulator teaches how hormonal axes function, how negative feedback regulates hormone secretion, and how different endocrine disorders disrupt hormonal balance.

The main educational principle is **visual cause and effect**.

Students should understand not only which hormone levels rise or fall, but also *why* those changes occur.

The simulator must be a fully functional educational application, not a prototype or static diagram.

## 2. Curriculum and Medical Accuracy

I will provide the Health Sciences textbook and relevant learning materials.

Before implementation:

- Review the supplied materials.
- Identify the endocrine axes, diseases, and mechanisms students are expected to learn.
- Use these materials to determine the appropriate educational depth.
- Maintain medical and physiological accuracy.
- Avoid unnecessary university-level complexity.
- Where the textbook simplifies a mechanism, use an educationally appropriate representation without introducing incorrect physiology.

The simulator should be understandable without requiring the teacher to explain every animation.

## 3. Endocrine Axes

Initially implement three hormonal axes:

**A. Thyroid axis**

Hypothalamus → TRH → Pituitary → TSH → Thyroid → T3/T4

Include negative feedback from thyroid hormones.

**B. Cortisol axis**

Hypothalamus → CRH → Pituitary → ACTH → Adrenal cortex → Cortisol

Include negative feedback from cortisol.

**C. Growth hormone axis**

Hypothalamus → GHRH / Somatostatin → Pituitary → GH → Liver and target tissues → IGF-1

Represent the relevant feedback mechanisms accurately, at the level appropriate for the textbook.

The architecture must allow additional endocrine axes to be added later without redesigning the application.

## 4. Diseases and Pathological Conditions

Each axis must support the diseases described in the supplied textbook.

Suggested conditions, subject to textbook coverage:

**Thyroid:**
- Normal physiology
- Graves' disease
- Toxic thyroid adenoma
- TSH-secreting pituitary adenoma
- Primary hypothyroidism
- Secondary hypothyroidism

**Cortisol:**
- Normal physiology
- ACTH-producing pituitary adenoma (Cushing disease)
- Cortisol-producing adrenal adenoma
- Ectopic ACTH production
- Exogenous glucocorticoid administration
- Primary adrenal insufficiency (Addison disease)
- Secondary adrenal insufficiency

**Growth hormone:**
- Normal physiology
- Acromegaly caused by a GH-secreting pituitary adenoma
- Growth hormone deficiency
- Other relevant disorders covered in the textbook

These are suggested starting lists. Check them against the educational materials before finalizing.

Each disease must have a clearly defined physiological mechanism and a consistent hormonal response.

## 5. Main Interface

The student first selects one of the three endocrine axes.

The selected axis opens as a large, clear, interactive visual diagram.

Display the hypothalamus, pituitary, relevant endocrine gland or target organ, hormonal pathways, and feedback loops.

Use attractive but scientifically recognizable illustrations.

Each hormone has:
- A consistent color and particle shape
- An animated secretion pathway
- A visual indicator of its relative level
- A Hebrew name and scientific abbreviation

Use simple relative hormone indicators such as:

Low / Normal / High

These indicators must change dynamically during the simulation.

Hormone particles should visibly travel between organs, with particle frequency reflecting relative secretion levels.

Feedback arrows should visually communicate inhibitory or stimulatory effects.

Avoid clutter and excessive animation.

## 6. Two Learning Modes

### Mode A — Learning and Exploration (מצב למידה)

The student selects a disease from the list.

The animation always starts with the normal, balanced endocrine axis.

The simulation then proceeds through a logical sequence:

1. Show normal hormone secretion and feedback.
2. Highlight the location or source of the pathological disturbance.
3. Introduce the disturbance.
4. Animate the immediate hormonal consequences.
5. Show the resulting feedback responses.
6. Reach the final pathological hormonal state.

Example: Primary adrenal insufficiency.

- The adrenal cortex loses cortisol-producing capacity.
- Cortisol secretion decreases.
- Negative feedback weakens.
- CRH and ACTH secretion increase.
- The animation displays the final hormonal pattern.

Example: Graves' disease.

- Stimulating antibodies appear and bind to thyroid TSH receptors.
- Thyroid hormone production increases.
- T3/T4 levels rise.
- Negative feedback reduces TRH and TSH.
- The stimulating antibodies remain active despite suppressed TSH.

Important: Graves' antibodies must be represented as antibodies, not as externally produced TSH.

### Mode B — Diagnosis Challenge (מצב אבחון)

The application randomly selects a disease from the currently selected axis.

The student sees the same physiological animation, starting from the normal state.

However:

- Do not reveal the disease name.
- Do not highlight the location where the disease originates.
- Do not display diagnostic explanations during the animation.
- Show all relevant hormone particles, including those originating outside the axis.
- Show the resulting changes in hormone secretion and feedback.

The student must identify the disease by selecting its name from the available options.

After submitting an answer:

- Indicate whether the answer is correct.
- Reveal the correct diagnosis.
- Replay or display the animation with the pathological source highlighted.
- Explain the mechanism and feedback response in clear, concise Hebrew.

The student should be able to try another randomly selected case.

## 7. External Hormone Sources

This is a central requirement.

The simulator must distinguish between hormones produced by the normal endocrine axis and substances originating outside that axis.

Examples:

- Ectopic ACTH secretion
- Exogenous glucocorticoids
- TSH receptor-stimulating antibodies in Graves' disease

Use a separate visual source outside the normal axis.

Particles from this source should have distinct colors or shapes.

Their identity and biological action must be medically accurate.

Examples:

Ectopic ACTH:
- ACTH enters the system from an external source.
- The adrenal cortex is stimulated.
- Cortisol increases.
- Hypothalamic CRH and pituitary ACTH production are suppressed by negative feedback.
- Ectopic ACTH secretion continues independently.

Exogenous glucocorticoids:
- An external glucocorticoid enters the system.
- Negative feedback suppresses CRH and ACTH.
- Endogenous adrenal cortisol production decreases.
- Distinguish the external glucocorticoid effect from endogenous cortisol production.

The external source must remain visible in both learning and diagnosis modes, but its pathological meaning should only be explained in learning mode or after the diagnosis answer.

## 8. Animation Engine

Build a reusable, data-driven animation engine.

Do not hardcode a completely separate animation for every disease.

Each disease should be defined by structured data specifying:

- Axis
- Disease name
- Primary disturbance
- Source of disturbance
- Hormone or receptor affected
- Direct physiological effects
- Feedback consequences
- Final hormone levels
- Sequence of animation events
- Educational explanation

The animation engine should interpret this information and produce the appropriate visual behavior.

A simple qualitative physiological model is sufficient. There is no need for numerical hormone concentrations or a complex mathematical simulation.

However, the resulting hormonal patterns must be medically consistent.

The engine must support disturbances at the hypothalamus, pituitary, endocrine gland, target tissues, or external sources.

## 9. Animation Controls

Provide:

- Play
- Pause
- Restart
- Animation speed control

Use smooth transitions between normal and pathological states.

Hormone particles, hormone-level indicators, and feedback arrows should change in a coordinated way.

The student must be able to replay an animation as often as desired.

## 10. Educational and Visual Design

The application must:

- Use Hebrew throughout the student-facing interface.
- Support full right-to-left layout.
- Be visually polished, intuitive, and engaging.
- Work on desktop computers and mobile phones.
- Use clear endocrine-organ illustrations.
- Maintain consistent colors and symbols across all axes.
- Avoid excessive explanatory text during animations.
- Provide short, understandable explanations after each learning scenario or diagnosis attempt.

The design should feel like an interactive biological laboratory rather than a multiple-choice quiz.

## 11. Technical Requirements

Build the application using HTML, CSS, and JavaScript, or another lightweight frontend approach if justified.

Requirements:

- Static hosting compatible with GitHub Pages.
- No backend required.
- No API keys.
- No AI service dependency.
- No database required.
- No student registration.
- All disease definitions stored locally in structured files.
- Clean, maintainable code.
- Easy addition of new diseases and endocrine axes.

Use appropriate libraries for smooth animation if necessary, but avoid unnecessary complexity.

## 12. Quality Assurance

Before considering the application complete:

1. Verify every hormonal pattern against the physiological mechanism and provided textbook.
2. Confirm that the normal state is correct for each axis.
3. Verify that each disease animation begins with a normal state and progresses logically.
4. Verify the accuracy of feedback loops.
5. Confirm that the learning and diagnosis modes use the same underlying disease definitions.
6. Ensure diagnosis mode never accidentally reveals the disease name or highlights its source before the answer.
7. Test every disease in both modes.
8. Test desktop and mobile layouts.
9. Check that all Hebrew labels display correctly.
10. Verify that the application runs locally and can be deployed to GitHub Pages.

Pay special attention to the difference between primary, secondary, and ectopic endocrine disorders.

## 13. Deliverables

Create the complete application, including:

- All source code
- All three endocrine axes
- All relevant textbook-supported diseases
- Both learning modes
- Fully functioning animations
- Hebrew interface
- Disease data files
- README with local execution and GitHub Pages deployment instructions

**Important final instruction:**

Do not stop after building one endocrine axis or a minimal demonstration.

Implement the complete first version covering all three axes and the relevant diseases.

Make reasonable technical and visual decisions independently, while prioritizing physiological correctness, educational clarity, and simplicity of use.

If the textbook or educational materials are missing, request them before finalizing the disease definitions and physiological content.
