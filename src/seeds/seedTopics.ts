import "dotenv/config";
import { EntityManager } from "typeorm";
import { AppDataSource } from "../data-source";
import { Exam } from "../entity/Exam";
import { ExamQuestion } from "../entity/ExamQuestion";
import {
  Question,
  QuestionCategory,
  QuestionType,
} from "../entity/Question";
import { QuestionOption } from "../entity/QuestionOption";
import { Topic, TopicType } from "../entity/Topic";

const SEED_PREFIX = "[Topic Seed]";

type OptionSeed = {
  label: string;
  content: string;
  isCorrect?: boolean;
};

type QuestionSeed = {
  content: string;
  explanation: string;
  audioUrl?: string;
  transcript?: string;
  options: OptionSeed[];
};

type ExamSeed = {
  title: string;
  questions: QuestionSeed[];
};

type TopicSeed = {
  title: string;
  description: string;
  type: TopicType;
  exams: ExamSeed[];
};

const AUDIO_URLS = [
  "https://www.voiptroubleshooter.com/open_speech/american/OSR_us_000_0010_8k.wav",
  "https://www.voiptroubleshooter.com/open_speech/american/OSR_us_000_0011_8k.wav",
  "https://www.voiptroubleshooter.com/open_speech/american/OSR_us_000_0030_8k.wav",
  "https://www.voiptroubleshooter.com/open_speech/american/OSR_us_000_0031_8k.wav",
  "https://www.voiptroubleshooter.com/open_speech/american/OSR_us_000_0060_8k.wav",
  "https://www.voiptroubleshooter.com/open_speech/american/OSR_us_000_0061_8k.wav",
  "https://www.voiptroubleshooter.com/open_speech/american/OSR_us_000_0050_8k.wav",
  "https://www.voiptroubleshooter.com/open_speech/american/OSR_us_000_0051_8k.wav",
];

const TOPIC_SEEDS: TopicSeed[] = [
  {
    title: "TOEIC Grammar - Tenses and Deadlines",
    description:
      "Grammar topic for TOEIC Reading Part 5: verb tense, deadlines, and common office actions.",
    type: TopicType.GRAMMAR,
    exams: [
      {
        title: "Tenses in Office Contexts",
        questions: [
          grammarQuestion(
            "The finance team _____ the quarterly report by Friday.",
            "must submit",
            ["must submit", "submitting", "submit to", "has submitting"],
            "Modal verbs are followed by the base verb."
          ),
          grammarQuestion(
            "Ms. Lin _____ the client before the meeting started.",
            "had called",
            ["had called", "has call", "calling", "will calling"],
            "Past perfect shows an action completed before another past action."
          ),
          grammarQuestion(
            "The updated schedule _____ to all employees yesterday.",
            "was sent",
            ["was sent", "sent", "will send", "sending"],
            "A passive verb is needed because the schedule receives the action."
          ),
          grammarQuestion(
            "Please let us know if the shipment _____ late.",
            "arrives",
            ["arrives", "arrive", "arriving", "arrival"],
            "The if-clause needs a present simple verb."
          ),
        ],
      },
    ],
  },
  {
    title: "TOEIC Grammar - Prepositions and Connectors",
    description:
      "Grammar topic for TOEIC Reading Part 5 and Part 6: prepositions, transition words, and sentence logic.",
    type: TopicType.GRAMMAR,
    exams: [
      {
        title: "Prepositions and Linking Words",
        questions: [
          grammarQuestion(
            "The workshop will take place _____ the third floor.",
            "on",
            ["on", "at", "by", "into"],
            "Use on for floors in a building."
          ),
          grammarQuestion(
            "The manager approved the proposal _____ the budget was limited.",
            "although",
            ["although", "because", "therefore", "so that"],
            "Although introduces a contrast."
          ),
          grammarQuestion(
            "All employees must register _____ noon on Monday.",
            "by",
            ["by", "during", "among", "beside"],
            "By is used for deadlines."
          ),
          grammarQuestion(
            "The brochure explains the service _____ clear detail.",
            "in",
            ["in", "on", "at", "with"],
            "In detail is the correct fixed phrase."
          ),
        ],
      },
    ],
  },
  {
    title: "TOEIC Listening - Office Requests",
    description:
      "Listening topic for short workplace requests, meeting changes, document printing, and office support.",
    type: TopicType.LISTENING,
    exams: [
      {
        title: "Short Office Requests",
        questions: [
          listeningQuestion(
            "What does the speaker ask for?",
            "A printed agenda",
            [
              "A printed agenda",
              "A parking pass",
              "A new laptop",
              "A lunch reservation",
            ],
            AUDIO_URLS[0],
            "Could you print the agenda before the client meeting starts?",
            "The request mentions printing the agenda before a client meeting."
          ),
          listeningQuestion(
            "When should the report be sent?",
            "Before noon",
            ["Before noon", "After dinner", "Next month", "At the airport"],
            AUDIO_URLS[1],
            "Please send the updated sales report before noon today.",
            "The speaker says the report should be sent before noon."
          ),
          listeningQuestion(
            "Where should the boxes be placed?",
            "Near the reception desk",
            [
              "Near the reception desk",
              "Inside the elevator",
              "Behind the restaurant",
              "At the train station",
            ],
            AUDIO_URLS[2],
            "Please leave the delivery boxes near the reception desk.",
            "The location is near the reception desk."
          ),
          listeningQuestion(
            "Who is the message for?",
            "The training team",
            ["The training team", "The hotel guest", "A taxi driver", "A supplier"],
            AUDIO_URLS[3],
            "This reminder is for the training team preparing room 204.",
            "The message explicitly says it is for the training team."
          ),
        ],
      },
    ],
  },
  {
    title: "TOEIC Listening - Announcements and Notices",
    description:
      "Listening topic for public announcements, building notices, travel updates, and customer information.",
    type: TopicType.LISTENING,
    exams: [
      {
        title: "Workplace and Public Announcements",
        questions: [
          listeningQuestion(
            "What will be closed today?",
            "The east entrance",
            ["The east entrance", "The parking garage", "The cafeteria", "The finance office"],
            AUDIO_URLS[4],
            "The east entrance will be closed today for sidewalk repairs.",
            "The announcement says the east entrance will be closed."
          ),
          listeningQuestion(
            "Where should passengers go?",
            "Platform three",
            ["Platform three", "Gate twelve", "Room 315", "The front desk"],
            AUDIO_URLS[5],
            "Train 406 to Riverside is now boarding at platform three.",
            "The boarding location is platform three."
          ),
          listeningQuestion(
            "What is due Friday?",
            "Quarterly reports",
            ["Quarterly reports", "Conference badges", "Hotel keys", "Meal tickets"],
            AUDIO_URLS[6],
            "Quarterly reports are due Friday and must be uploaded online.",
            "The item due Friday is quarterly reports."
          ),
          listeningQuestion(
            "Why is the picnic moving indoors?",
            "Rain is expected",
            ["Rain is expected", "The room is full", "Lunch is delayed", "Tickets sold out"],
            AUDIO_URLS[7],
            "Because rain is expected, the company picnic will move inside.",
            "The reason is expected rain."
          ),
        ],
      },
    ],
  },
];

function grammarQuestion(
  content: string,
  correctAnswer: string,
  options: string[],
  explanation: string
): QuestionSeed {
  return {
    content,
    explanation,
    options: makeOptions(correctAnswer, options),
  };
}

function listeningQuestion(
  content: string,
  correctAnswer: string,
  options: string[],
  audioUrl: string,
  transcript: string,
  explanation: string
): QuestionSeed {
  return {
    content,
    explanation,
    audioUrl,
    transcript,
    options: makeOptions(correctAnswer, options),
  };
}

function makeOptions(correctAnswer: string, options: string[]): OptionSeed[] {
  const labels = ["A", "B", "C", "D"];
  return options.map((content, index) => ({
    label: labels[index],
    content,
    isCorrect: content === correctAnswer,
  }));
}

async function removeExistingSeedTopics(manager: EntityManager) {
  const existingTopics = await manager
    .getRepository(Topic)
    .createQueryBuilder("topic")
    .where("topic.title LIKE :title", { title: `${SEED_PREFIX}%` })
    .getMany();

  if (existingTopics.length > 0) {
    await manager.remove(Topic, existingTopics);
  }
}

async function createQuestion(
  manager: EntityManager,
  examId: number,
  topicType: TopicType,
  orderIndex: number,
  questionSeed: QuestionSeed
) {
  const question = await manager.save(
    manager.create(Question, {
      category:
        topicType === TopicType.LISTENING
          ? QuestionCategory.LISTENING
          : QuestionCategory.GRAMMAR,
      type: QuestionType.SINGLE_CHOICE,
      content: questionSeed.content,
      explanation: questionSeed.explanation,
      audioUrl: questionSeed.audioUrl ?? null,
      audioFileName: questionSeed.audioUrl ? "open-speech-public.wav" : null,
      transcript: questionSeed.transcript ?? null,
      showTranscript: Boolean(questionSeed.transcript),
      dictationAnswer: null,
    })
  );

  await manager.save(
    questionSeed.options.map((option) =>
      manager.create(QuestionOption, {
        questionId: question.id,
        label: option.label,
        content: option.content,
        isCorrect: option.isCorrect === true,
      })
    )
  );

  await manager.save(
    manager.create(ExamQuestion, {
      examId,
      questionId: question.id,
      orderIndex,
    })
  );
}

export async function seedTopics() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  await AppDataSource.transaction(async (manager) => {
    await removeExistingSeedTopics(manager);

    for (const topicSeed of TOPIC_SEEDS) {
      const topic = await manager.save(
        manager.create(Topic, {
          title: `${SEED_PREFIX} ${topicSeed.title}`,
          description: topicSeed.description,
          type: topicSeed.type,
        })
      );

      for (const examSeed of topicSeed.exams) {
        const exam = await manager.save(
          manager.create(Exam, {
            topicId: topic.id,
            title: examSeed.title,
            isActive: true,
          })
        );

        for (let index = 0; index < examSeed.questions.length; index += 1) {
          await createQuestion(
            manager,
            exam.id,
            topicSeed.type,
            index + 1,
            examSeed.questions[index]
          );
        }
      }
    }
  });

  const [topics, exams, questions] = await Promise.all([
    AppDataSource.getRepository(Topic)
      .createQueryBuilder("topic")
      .where("topic.title LIKE :title", { title: `${SEED_PREFIX}%` })
      .getCount(),
    AppDataSource.getRepository(Exam).count(),
    AppDataSource.getRepository(Question).count(),
  ]);

  console.log(
    `[topic-seed] Seeded topics: ${topics}; total exams=${exams}; total questions=${questions}`
  );
}

if (require.main === module) {
  seedTopics()
    .then(async () => {
      if (AppDataSource.isInitialized) await AppDataSource.destroy();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error(error);
      if (AppDataSource.isInitialized) await AppDataSource.destroy();
      process.exit(1);
    });
}
