export interface FlashcardItem {
  front: string;
  back: string;
}

export interface QuizItem {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface TutorOutput {
  topic: string;
  explanation: string[];
  flashcards: FlashcardItem[];
  quiz: QuizItem[];
}

const templates: Record<string, TutorOutput> = {
  photosynthesis: {
    topic: "Photosynthesis",
    explanation: [
      "Photosynthesis is the process by which green plants and certain organisms convert light energy into chemical energy stored in glucose.",
      "It occurs primarily in the chloroplasts of plant cells, using chlorophyll as the main pigment to absorb sunlight.",
      "The overall equation is: 6CO2 + 6H2O + light energy -> C6H12O6 + 6O2.",
      "The process consists of two stages: the light-dependent reactions (in the thylakoid membranes) and the Calvin cycle (in the stroma).",
      "Light-dependent reactions produce ATP and NADPH, which power the Calvin cycle to fix carbon dioxide into organic molecules.",
    ],
    flashcards: [
      { front: "Where do the light-dependent reactions of photosynthesis take place?", back: "In the thylakoid membranes of the chloroplast." },
      { front: "What is the primary pigment used in photosynthesis?", back: "Chlorophyll, which absorbs red and blue light and reflects green light." },
      { front: "What are the products of the light-dependent reactions?", back: "ATP, NADPH, and oxygen (O2) as a byproduct." },
      { front: "What is the Calvin cycle and where does it occur?", back: "The Calvin cycle is the light-independent stage of photosynthesis that fixes CO2 into glucose. It occurs in the stroma of the chloroplast." },
      { front: "What is the overall equation for photosynthesis?", back: "6CO2 + 6H2O + light energy -> C6H12O6 + 6O2" },
    ],
    quiz: [
      {
        question: "Which molecule is the primary energy carrier produced during the light-dependent reactions?",
        options: ["Glucose", "ATP", "Carbon dioxide", "Water"],
        correctIndex: 1,
      },
      {
        question: "What gas is released as a byproduct of photosynthesis?",
        options: ["Carbon dioxide", "Nitrogen", "Oxygen", "Hydrogen"],
        correctIndex: 2,
      },
      {
        question: "In which part of the chloroplast does the Calvin cycle occur?",
        options: ["Thylakoid membrane", "Outer membrane", "Stroma", "Inner membrane"],
        correctIndex: 2,
      },
    ],
  },

  "newton's laws": {
    topic: "Newton's Laws of Motion",
    explanation: [
      "Newton's First Law (Inertia): An object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted upon by a net external force.",
      "Newton's Second Law: The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass (F = ma).",
      "Newton's Third Law: For every action, there is an equal and opposite reaction. Forces always come in pairs acting on different objects.",
      "These three laws form the foundation of classical mechanics and describe the relationship between forces and the motion of objects.",
      "Applications include calculating projectile trajectories, understanding friction, designing vehicles, and analyzing structural forces in engineering.",
    ],
    flashcards: [
      { front: "State Newton's First Law of Motion.", back: "An object at rest stays at rest, and an object in motion continues at constant velocity, unless acted upon by a net external force. This is also called the Law of Inertia." },
      { front: "What is the formula for Newton's Second Law?", back: "F = ma, where F is the net force, m is mass, and a is acceleration." },
      { front: "Give an example of Newton's Third Law.", back: "When you push against a wall, the wall pushes back on you with equal force in the opposite direction." },
      { front: "What is inertia?", back: "Inertia is the tendency of an object to resist changes in its state of motion. It is directly related to the object's mass." },
      { front: "If a 5 kg object accelerates at 3 m/s^2, what is the net force?", back: "F = ma = 5 kg x 3 m/s^2 = 15 Newtons." },
    ],
    quiz: [
      {
        question: "Which law explains why passengers lurch forward when a car stops suddenly?",
        options: ["Newton's Second Law", "Newton's Third Law", "Newton's First Law", "Law of Gravitation"],
        correctIndex: 2,
      },
      {
        question: "According to F = ma, what happens to acceleration if the force is doubled but mass stays the same?",
        options: ["Acceleration is halved", "Acceleration stays the same", "Acceleration is doubled", "Acceleration is quadrupled"],
        correctIndex: 2,
      },
      {
        question: "A rocket propels itself by expelling gas downward. Which law best explains this?",
        options: ["Newton's First Law", "Newton's Second Law", "Newton's Third Law", "Law of Conservation of Energy"],
        correctIndex: 2,
      },
    ],
  },

  "world war 2": {
    topic: "World War 2",
    explanation: [
      "World War 2 (1939-1945) was a global conflict involving the Allied Powers (including the US, UK, Soviet Union, and France) against the Axis Powers (Germany, Italy, and Japan).",
      "The war began when Nazi Germany invaded Poland on September 1, 1939, prompting Britain and France to declare war on Germany.",
      "Key turning points included the Battle of Stalingrad (1942-1943), D-Day invasion of Normandy (June 6, 1944), and the Battle of Midway (1942) in the Pacific.",
      "The Holocaust was the systematic genocide of six million Jews and millions of others by the Nazi regime, representing one of history's greatest atrocities.",
      "The war ended with Germany's unconditional surrender in May 1945 (V-E Day) and Japan's surrender in August 1945 following the atomic bombings of Hiroshima and Nagasaki.",
    ],
    flashcards: [
      { front: "When did World War 2 begin and what event triggered it?", back: "It began on September 1, 1939, when Nazi Germany invaded Poland." },
      { front: "What were the two main alliance groups in WW2?", back: "The Allied Powers (US, UK, Soviet Union, France, and others) and the Axis Powers (Germany, Italy, Japan)." },
      { front: "What was D-Day?", back: "D-Day (June 6, 1944) was the Allied invasion of Normandy, France, which opened a crucial Western Front against Nazi Germany." },
      { front: "What was the significance of the Battle of Stalingrad?", back: "The Battle of Stalingrad (1942-1943) was a major turning point on the Eastern Front where the Soviet Union defeated Germany, marking the beginning of Germany's retreat." },
      { front: "How did World War 2 end in the Pacific theater?", back: "Japan surrendered on August 15, 1945 (V-J Day), following the atomic bombings of Hiroshima (August 6) and Nagasaki (August 9)." },
    ],
    quiz: [
      {
        question: "Which event is considered the start of World War 2?",
        options: ["Bombing of Pearl Harbor", "Invasion of Poland", "Battle of Britain", "Treaty of Versailles"],
        correctIndex: 1,
      },
      {
        question: "Which battle is considered the turning point of the Pacific War?",
        options: ["Battle of Iwo Jima", "Battle of Midway", "Battle of the Bulge", "Battle of Okinawa"],
        correctIndex: 1,
      },
      {
        question: "On what date did the Allied forces launch the D-Day invasion of Normandy?",
        options: ["May 8, 1945", "December 7, 1941", "June 6, 1944", "August 6, 1945"],
        correctIndex: 2,
      },
    ],
  },
};

function normalizeTopicKey(input: string): string | null {
  const lower = input.toLowerCase().trim();
  for (const key of Object.keys(templates)) {
    if (lower.includes(key) || key.includes(lower)) {
      return key;
    }
  }
  return null;
}

function generateFromText(text: string): TutorOutput {
  const words = text.trim().split(/\s+/);
  const topic = words.slice(0, 6).join(" ");

  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  const explanation: string[] = [];
  for (let i = 0; i < Math.min(5, sentences.length); i++) {
    explanation.push(sentences[i] + ".");
  }
  while (explanation.length < 5) {
    explanation.push(`Further study is recommended to deepen understanding of ${topic}.`);
  }

  const keyPhrases = sentences.slice(0, 5);
  const flashcards: FlashcardItem[] = keyPhrases.map((phrase, i) => ({
    front: `What is described by: "${phrase.slice(0, 80)}..."?`,
    back: phrase + ".",
  }));
  while (flashcards.length < 5) {
    flashcards.push({
      front: `Define a key concept related to ${topic}.`,
      back: `Review your notes on ${topic} for a detailed explanation.`,
    });
  }

  const quiz: QuizItem[] = [];
  for (let i = 0; i < Math.min(3, keyPhrases.length); i++) {
    const correct = keyPhrases[i].slice(0, 60);
    quiz.push({
      question: `Which of the following best relates to ${topic}?`,
      options: [
        correct,
        "An unrelated concept from a different field",
        "None of the above",
        "This topic has not been covered",
      ],
      correctIndex: 0,
    });
  }
  while (quiz.length < 3) {
    quiz.push({
      question: `What is an important aspect of ${topic}?`,
      options: [
        "It requires further study",
        "It is not relevant",
        "It has no applications",
        "It cannot be learned",
      ],
      correctIndex: 0,
    });
  }

  return { topic, explanation, flashcards, quiz };
}

export function generateTutorContent(input: string): TutorOutput {
  const templateKey = normalizeTopicKey(input);
  if (templateKey) {
    return templates[templateKey];
  }
  return generateFromText(input);
}
