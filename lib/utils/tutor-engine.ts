import type { Task } from "@/lib/types/database";
import { getLocalISODate } from "@/lib/utils/date";

export type TutorMode = "explain" | "flashcards" | "quiz" | "exam_prep";
export type TutorConfidence = "high" | "medium";

export interface FlashcardItem {
  front: string;
  back: string;
}

export interface QuizItem {
  question: string;
  options: string[];
  correctIndex: number;
  rationale: string;
}

export interface StudyStep {
  title: string;
  durationMins: number;
  detail: string;
}

export interface TutorOutput {
  topic: string;
  mode: TutorMode;
  summary: string;
  explanation: string[];
  keyPoints: string[];
  flashcards: FlashcardItem[];
  quiz: QuizItem[];
  studyPlan: StudyStep[];
  followUpPrompts: string[];
  contextSignals: string[];
  confidence: TutorConfidence;
}

export interface GenerateTutorContentInput {
  prompt: string;
  mode?: TutorMode;
  includePlannerContext?: boolean;
  tasks?: Task[];
}

interface TopicTemplate {
  key: string;
  topic: string;
  aliases: string[];
  summary: string;
  explanation: string[];
  keyPoints: string[];
  flashcards: FlashcardItem[];
  quiz: QuizItem[];
}

const MODE_CONFIG: Record<
  TutorMode,
  { explanationCount: number; keyPointsCount: number; flashcardCount: number; quizCount: number }
> = {
  explain: { explanationCount: 5, keyPointsCount: 6, flashcardCount: 5, quizCount: 3 },
  flashcards: { explanationCount: 3, keyPointsCount: 7, flashcardCount: 8, quizCount: 2 },
  quiz: { explanationCount: 4, keyPointsCount: 6, flashcardCount: 4, quizCount: 6 },
  exam_prep: { explanationCount: 6, keyPointsCount: 8, flashcardCount: 6, quizCount: 5 },
};

const DISTRACTOR_TEMPLATES = [
  "A secondary detail that is not central to this concept",
  "A statement that reverses the main principle",
  "A common misconception beginners often repeat",
  "A claim with no direct evidence in this topic",
];

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "its",
  "me",
  "my",
  "of",
  "on",
  "or",
  "our",
  "that",
  "the",
  "this",
  "to",
  "what",
  "when",
  "where",
  "which",
  "with",
  "you",
  "your",
]);

const TEMPLATE_LIBRARY: TopicTemplate[] = [
  {
    key: "photosynthesis",
    topic: "Photosynthesis",
    aliases: ["chloroplast", "calvin cycle", "light reaction"],
    summary:
      "Photosynthesis converts light into chemical energy, producing glucose for growth and oxygen as a byproduct.",
    explanation: [
      "Plants capture light energy through chlorophyll in chloroplasts.",
      "Light-dependent reactions generate ATP and NADPH in the thylakoid membranes.",
      "The Calvin cycle uses ATP and NADPH to fix carbon dioxide into organic molecules.",
      "The process links cellular energy, carbon cycles, and ecosystem oxygen balance.",
      "Understanding inputs, outputs, and location of each stage helps solve exam questions quickly.",
    ],
    keyPoints: [
      "Light-dependent reactions occur in the thylakoid membranes.",
      "The Calvin cycle occurs in the chloroplast stroma.",
      "ATP and NADPH power carbon fixation into sugars.",
      "Oxygen is released mainly from water splitting.",
      "Photosynthesis links sunlight, carbon dioxide, and biomass production.",
      "Stage location and molecule flow are common assessment points.",
    ],
    flashcards: [
      { front: "Where do light-dependent reactions happen?", back: "In the thylakoid membranes." },
      { front: "What powers the Calvin cycle?", back: "ATP and NADPH from light reactions." },
      { front: "What is the main product plants store?", back: "Glucose and related carbohydrates." },
      { front: "Why is oxygen released?", back: "Water is split during the light-dependent stage." },
      { front: "Where does carbon fixation occur?", back: "In the chloroplast stroma." },
    ],
    quiz: [
      {
        question: "Which structure hosts the light-dependent stage?",
        options: ["Stroma", "Thylakoid membrane", "Nucleus", "Ribosome"],
        correctIndex: 1,
        rationale: "Light reactions are membrane-based because electron transport chains are embedded there.",
      },
      {
        question: "What is the direct role of ATP/NADPH in photosynthesis?",
        options: [
          "Store oxygen permanently",
          "Build chlorophyll molecules",
          "Fuel carbon fixation in the Calvin cycle",
          "Transport water to roots",
        ],
        correctIndex: 2,
        rationale: "ATP and NADPH provide energy and reducing power for sugar synthesis.",
      },
      {
        question: "Why is photosynthesis vital to ecosystems?",
        options: [
          "It removes all atmospheric nitrogen",
          "It converts light to stored chemical energy",
          "It eliminates cellular respiration",
          "It stops carbon movement",
        ],
        correctIndex: 1,
        rationale: "It forms the base of food webs by producing usable organic matter.",
      },
    ],
  },
  {
    key: "newton laws",
    topic: "Newton's Laws of Motion",
    aliases: ["inertia", "f = ma", "third law", "forces"],
    summary:
      "Newton's laws explain how forces affect motion, from inertia to acceleration and action-reaction pairs.",
    explanation: [
      "First law: motion state stays unchanged unless a net external force acts.",
      "Second law: acceleration scales with force and inversely with mass.",
      "Third law: forces appear in equal and opposite interaction pairs.",
      "Together, these laws connect free-body diagrams with measurable motion changes.",
      "Exam success depends on identifying the system and net force correctly.",
    ],
    keyPoints: [
      "Inertia is resistance to change in motion.",
      "Net force determines acceleration direction and magnitude.",
      "Mass reduces acceleration for the same applied force.",
      "Action-reaction forces act on different objects.",
      "Free-body diagrams prevent force-accounting mistakes.",
      "Units and sign convention are critical in calculations.",
    ],
    flashcards: [
      { front: "State Newton's first law.", back: "An object stays at rest or constant velocity unless net force acts." },
      { front: "Write Newton's second law.", back: "F = m * a." },
      { front: "What does Newton's third law state?", back: "Every action has an equal and opposite reaction." },
      { front: "Why use free-body diagrams?", back: "To isolate forces acting on one object." },
      { front: "If force increases with same mass, what changes?", back: "Acceleration increases proportionally." },
    ],
    quiz: [
      {
        question: "Passengers move forward when a car brakes because of...",
        options: ["Third law", "Inertia", "Gravitation", "Frictionless mass"],
        correctIndex: 1,
        rationale: "Body motion tends to continue until another force changes it.",
      },
      {
        question: "If force doubles and mass stays constant, acceleration...",
        options: ["Halves", "Doubles", "Stays constant", "Becomes zero"],
        correctIndex: 1,
        rationale: "From F = ma, acceleration is directly proportional to force.",
      },
      {
        question: "Action-reaction force pairs act on...",
        options: ["The same object", "Different objects", "Only moving objects", "Only rigid bodies"],
        correctIndex: 1,
        rationale: "Each body exerts a force on the other body in the interaction.",
      },
    ],
  },
  {
    key: "world war 2",
    topic: "World War II",
    aliases: ["ww2", "normandy", "stalingrad", "axis", "allies"],
    summary:
      "World War II was a global conflict shaped by alliances, industrial warfare, and key turning points between 1939 and 1945.",
    explanation: [
      "The conflict escalated after the invasion of Poland in 1939.",
      "Allied and Axis coalitions fought across Europe, Africa, and the Pacific.",
      "Strategic turning points shifted momentum in both theaters.",
      "Civilian impact and the Holocaust define major ethical and historical lessons.",
      "Chronology and causality are essential for strong historical analysis.",
    ],
    keyPoints: [
      "Invasion of Poland in 1939 triggered wider war declarations.",
      "Allied and Axis blocs drove strategic decision-making.",
      "Major turning points changed military momentum by 1943-1944.",
      "Industrial and logistics capacity shaped campaign outcomes.",
      "Civilian casualties and genocide are central to interpretation.",
      "Post-war institutions emerged partly in response to this conflict.",
    ],
    flashcards: [
      { front: "What event marked the beginning of WW2 in Europe?", back: "Germany's invasion of Poland in 1939." },
      { front: "Name the two main opposing alliances.", back: "Allied powers and Axis powers." },
      { front: "Why are turning points important in WW2 study?", back: "They explain when and why momentum shifted." },
      { front: "What is a key humanitarian dimension of WW2?", back: "The Holocaust and large-scale civilian loss." },
      { front: "Why compare theaters of war?", back: "Each theater had different strategy, logistics, and timelines." },
    ],
    quiz: [
      {
        question: "Which event triggered immediate British and French war declarations?",
        options: ["Pearl Harbor", "Invasion of Poland", "Battle of the Bulge", "Yalta Conference"],
        correctIndex: 1,
        rationale: "The September 1939 invasion drove direct escalation in Europe.",
      },
      {
        question: "Why are logistics repeatedly emphasized in WW2 analysis?",
        options: [
          "They were irrelevant to campaign outcomes",
          "Supply capacity shaped strategic feasibility",
          "Only naval battles required logistics",
          "Logistics replaced political goals",
        ],
        correctIndex: 1,
        rationale: "Sustaining troops and equipment determined what operations were possible.",
      },
      {
        question: "A strong WW2 essay should prioritize...",
        options: [
          "Memorizing dates only",
          "Single-event explanations",
          "Chronology plus cause-and-effect links",
          "Ignoring social consequences",
        ],
        correctIndex: 2,
        rationale: "High-quality analysis connects events, motivations, and consequences.",
      },
    ],
  },
];

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((value) => value.trim())
    .filter((value) => value.length > 8);
}

function extractTopic(input: string): string {
  const firstLine = input.trim().split("\n")[0] ?? input.trim();
  const compact = firstLine.replace(/\s+/g, " ").trim();
  if (!compact) return "Study Topic";

  const shortCandidate = compact.split(/[.!?]/)[0]?.trim() ?? compact;
  const tokens = shortCandidate.split(/\s+/);
  if (tokens.length <= 8) {
    return toTitleCase(shortCandidate);
  }
  return toTitleCase(tokens.slice(0, 6).join(" "));
}

function extractKeywords(input: string, limit = 8): string[] {
  const words = normalize(input).split(" ");
  const byFrequency = new Map<string, number>();

  for (const word of words) {
    if (!word || word.length < 3 || STOP_WORDS.has(word)) continue;
    byFrequency.set(word, (byFrequency.get(word) ?? 0) + 1);
  }

  return [...byFrequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .map((entry) => entry[0])
    .slice(0, limit);
}

function matchTemplate(prompt: string): TopicTemplate | null {
  const normalizedPrompt = normalize(prompt);
  for (const template of TEMPLATE_LIBRARY) {
    const candidates = [template.key, template.topic, ...template.aliases].map(normalize);
    if (candidates.some((candidate) => candidate && normalizedPrompt.includes(candidate))) {
      return template;
    }
  }
  return null;
}

function dedupe(values: string[], limit: number): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const rawValue of values) {
    const value = rawValue.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(value);
    if (output.length >= limit) break;
  }
  return output;
}

function buildGenericSummary(topic: string, keywords: string[]): string {
  if (keywords.length === 0) {
    return `${topic} can be learned faster by combining concept understanding, active recall, and short assessment loops.`;
  }
  const highlighted = keywords.slice(0, 3).join(", ");
  return `${topic} should be studied through core ideas like ${highlighted}, then reinforced with flashcards and targeted quiz practice.`;
}

function buildGenericExplanation(topic: string, sentences: string[], keywords: string[]): string[] {
  const fromInput = sentences.slice(0, 3).map((sentence) => {
    return sentence.endsWith(".") ? sentence : `${sentence}.`;
  });

  const scaffold = [
    `${topic} is easier to master when you separate definitions, mechanism, and application.`,
    `Focus on causal relationships first, then memorize key terms and exceptions.`,
    `Use short recall cycles: explain from memory, verify, and correct weak spots.`,
    `Translate each concept into one practical example to improve retention.`,
  ];

  if (keywords.length > 0) {
    scaffold.unshift(`Your prompt suggests emphasis on: ${keywords.slice(0, 4).join(", ")}.`);
  }

  return dedupe([...fromInput, ...scaffold], 7);
}

function buildGenericKeyPoints(topic: string, keywords: string[], explanation: string[]): string[] {
  const points: string[] = [
    `Define ${topic} in one sentence before studying details.`,
    `Identify the highest-yield terms and formulas that are frequently tested.`,
    `Connect each key idea to one example and one common mistake.`,
    `Review with active recall instead of passive rereading.`,
  ];

  for (const keyword of keywords.slice(0, 5)) {
    points.push(`Clarify how "${keyword}" contributes to the full picture of ${topic}.`);
  }

  for (const sentence of explanation.slice(0, 3)) {
    points.push(sentence.replace(/\.$/, ""));
  }

  return dedupe(points, 10);
}

function createFlashcardFromPoint(topic: string, point: string): FlashcardItem {
  return {
    front: `Explain this idea in ${topic}: ${point}`,
    back: `${point}. Keep your answer concise, then add one concrete example.`,
  };
}

function createQuizFromPoint(topic: string, point: string, index: number): QuizItem {
  const correctIndex = index % 4;
  const correctText = point;
  const baseDistractors = DISTRACTOR_TEMPLATES.map((template) => `${template}.`);
  const options = baseDistractors.slice(0, 3);
  options.splice(correctIndex, 0, correctText);

  return {
    question: `Which statement best matches a core principle of ${topic}?`,
    options,
    correctIndex,
    rationale: `The correct choice reflects the key point: "${correctText}".`,
  };
}

function computeTaskDeadlineWeight(deadline: string | null, today: string): number {
  if (!deadline) return 0;
  if (deadline < today) return 3;
  if (deadline === today) return 4;

  const todayDate = new Date(`${today}T00:00:00`);
  const deadlineDate = new Date(`${deadline}T00:00:00`);
  const diffMs = deadlineDate.getTime() - todayDate.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays <= 2) return 3;
  if (diffDays <= 5) return 2;
  return 1;
}

function scoreTaskRelevance(task: Task, topic: string, keywords: string[], today: string): number {
  const haystack = normalize(
    [task.title, task.description ?? "", task.course ?? "", task.source_text ?? ""].join(" ")
  );
  let score = 0;

  const topicParts = normalize(topic).split(" ").filter((part) => part.length > 2);
  for (const part of topicParts) {
    if (haystack.includes(part)) score += 2;
  }
  for (const keyword of keywords) {
    if (haystack.includes(keyword)) score += 1;
  }
  if (task.priority === "high") score += 2;
  score += computeTaskDeadlineWeight(task.deadline, today);
  return score;
}

function getRelevantTasks(tasks: Task[] | undefined, topic: string, keywords: string[]): Task[] {
  if (!tasks || tasks.length === 0) return [];
  const today = getLocalISODate();

  return tasks
    .filter((task) => task.status !== "completed")
    .map((task) => ({ task, score: scoreTaskRelevance(task, topic, keywords, today) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.task);
}

function buildContextSignals(tasks: Task[] | undefined, relatedTasks: Task[]): string[] {
  if (!tasks || tasks.length === 0) return [];

  const active = tasks.filter((task) => task.status !== "completed");
  const highPriority = active.filter((task) => task.priority === "high");
  const dueSoon = active
    .filter((task) => !!task.deadline)
    .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""));

  const signals: string[] = [];
  signals.push(`${active.length} active planner task${active.length === 1 ? "" : "s"} detected.`);

  if (highPriority.length > 0) {
    signals.push(`${highPriority.length} high-priority task${highPriority.length === 1 ? "" : "s"} should stay in your study loop.`);
  }
  if (dueSoon.length > 0) {
    signals.push(`Nearest deadline: ${dueSoon[0].deadline}.`);
  }
  if (relatedTasks.length > 0) {
    signals.push(`Most relevant task: "${relatedTasks[0].title}".`);
  }

  return dedupe(signals, 4);
}

function buildStudyPlan(
  topic: string,
  mode: TutorMode,
  relatedTasks: Task[]
): StudyStep[] {
  const basePlan: StudyStep[] = [
    {
      title: "Concept Warm-up",
      durationMins: 12,
      detail: `Write a one-paragraph explanation of ${topic} from memory before checking notes.`,
    },
    {
      title: "Deep Review",
      durationMins: 25,
      detail: "Map core definitions, mechanisms, and edge cases in a compact outline.",
    },
    {
      title: "Active Recall",
      durationMins: 18,
      detail: "Cover your notes and answer flashcards out loud until recall is stable.",
    },
    {
      title: "Check Understanding",
      durationMins: 15,
      detail: "Complete a short quiz and analyze every mistake by cause.",
    },
  ];

  if (mode === "exam_prep") {
    basePlan.splice(3, 0, {
      title: "Exam Simulation",
      durationMins: 30,
      detail: "Solve timed questions without notes and track weak categories.",
    });
  }

  if (relatedTasks.length > 0) {
    const task = relatedTasks[0];
    basePlan.push({
      title: "Task Transfer",
      durationMins: 20,
      detail: `Apply today's review directly to: "${task.title}". Ship one concrete output before stopping.`,
    });
  }

  return basePlan;
}

function buildFollowUpPrompts(topic: string, mode: TutorMode, relatedTasks: Task[]): string[] {
  const prompts: string[] = [
    `Give me harder quiz questions on ${topic}.`,
    `Create a 10-minute review sprint for ${topic}.`,
    `Explain ${topic} with one real-world analogy.`,
    `Which mistakes should I avoid in ${topic} exams?`,
  ];

  if (mode !== "flashcards") {
    prompts.push(`Generate 12 flashcards for ${topic} with concise answers.`);
  }
  if (mode !== "quiz") {
    prompts.push(`Turn ${topic} into a short quiz with answer rationales.`);
  }
  if (relatedTasks.length > 0) {
    prompts.push(`Connect ${topic} to my task "${relatedTasks[0].title}" and propose execution steps.`);
  }

  return dedupe(prompts, 6);
}

function applyModeLimits(
  mode: TutorMode,
  explanation: string[],
  keyPoints: string[],
  flashcards: FlashcardItem[],
  quiz: QuizItem[]
) {
  const config = MODE_CONFIG[mode];
  return {
    explanation: explanation.slice(0, config.explanationCount),
    keyPoints: keyPoints.slice(0, config.keyPointsCount),
    flashcards: flashcards.slice(0, config.flashcardCount),
    quiz: quiz.slice(0, config.quizCount),
  };
}

export function generateTutorContent({
  prompt,
  mode = "explain",
  includePlannerContext = true,
  tasks = [],
}: GenerateTutorContentInput): TutorOutput {
  const cleanedPrompt = prompt.trim();
  if (!cleanedPrompt) {
    throw new Error("Please enter a topic or question.");
  }

  const template = matchTemplate(cleanedPrompt);
  const topic = template?.topic ?? extractTopic(cleanedPrompt);
  const keywords = extractKeywords(cleanedPrompt);
  const sentences = extractSentences(cleanedPrompt);

  const summary = template?.summary ?? buildGenericSummary(topic, keywords);
  const explanation = template?.explanation ?? buildGenericExplanation(topic, sentences, keywords);
  const keyPoints = template?.keyPoints ?? buildGenericKeyPoints(topic, keywords, explanation);

  const relatedTasks = includePlannerContext ? getRelevantTasks(tasks, topic, keywords) : [];
  const contextSignals = includePlannerContext ? buildContextSignals(tasks, relatedTasks) : [];

  const flashcards = template?.flashcards ?? keyPoints.map((point) => createFlashcardFromPoint(topic, point));
  const quiz = template?.quiz ?? keyPoints.map((point, index) => createQuizFromPoint(topic, point, index));

  const modeLimited = applyModeLimits(mode, explanation, keyPoints, flashcards, quiz);

  if (relatedTasks.length > 0) {
    modeLimited.keyPoints.unshift(
      `Prioritize "${relatedTasks[0].title}" while reviewing ${topic}; it is the highest-impact related task right now.`
    );
  }

  const studyPlan = buildStudyPlan(topic, mode, relatedTasks);
  const followUpPrompts = buildFollowUpPrompts(topic, mode, relatedTasks);
  const confidence: TutorConfidence =
    template || cleanedPrompt.split(/\s+/).length > 18 ? "high" : "medium";

  return {
    topic,
    mode,
    summary,
    explanation: dedupe(modeLimited.explanation, MODE_CONFIG[mode].explanationCount),
    keyPoints: dedupe(modeLimited.keyPoints, MODE_CONFIG[mode].keyPointsCount),
    flashcards: modeLimited.flashcards,
    quiz: modeLimited.quiz,
    studyPlan,
    followUpPrompts,
    contextSignals,
    confidence,
  };
}

