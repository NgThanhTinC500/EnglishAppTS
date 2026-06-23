import "dotenv/config";
import { EntityManager } from "typeorm";
import { AppDataSource } from "../data-source";
import { Exam } from "../entity/Exam";
import { ExamQuestion } from "../entity/ExamQuestion";
import { Question, QuestionCategory, QuestionType } from "../entity/Question";
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

type TopicSeed = {
  title: string;
  description: string;
  type: TopicType;
  examTitle: string;
  questions: QuestionSeed[];
};

const AUDIO_URLS = [
  10, 11, 12, 13, 14,
  15, 16, 17, 18, 19,
  30, 31, 32, 34, 35,
  36, 37, 38, 39, 40,
].map((id) =>
  `https://www.voiptroubleshooter.com/open_speech/american/OSR_us_000_${String(id).padStart(4, "0")}_8k.wav`
);

const GRAMMAR_EXAMS = [
  {
    title: "TOEIC Grammar - Verb Tenses",
    description: "Reading Part 5 grammar practice for verb tense, passive voice, and office deadlines.",
    examTitle: "Grammar Test 01 - Verb Tenses",
    rows: [
      ["The finance team _____ the quarterly report by Friday.", "must submit", ["must submit", "submitting", "submit to", "has submitting"], "Cấu trúc: sau modal verb 'must' dùng động từ nguyên mẫu, nên đáp án đúng là 'must submit'."],
      ["Ms. Lin _____ the client before the meeting started.", "had called", ["had called", "has call", "calling", "will calling"], "Cấu trúc: hành động xảy ra trước một mốc quá khứ khác dùng quá khứ hoàn thành: had + V3."],
      ["The updated schedule _____ to all employees yesterday.", "was sent", ["was sent", "sent", "will send", "sending"], "Cấu trúc: chủ ngữ là vật nhận hành động nên dùng bị động quá khứ: was/were + V3."],
      ["Please let us know if the shipment _____ late.", "arrives", ["arrives", "arrive", "arriving", "arrival"], "Cấu trúc: mệnh đề điều kiện loại 1 sau 'if' dùng hiện tại đơn."],
      ["The director _____ the proposal at tomorrow's meeting.", "will review", ["will review", "reviewing", "has review", "reviewed by"], "Cấu trúc: 'tomorrow' chỉ tương lai, dùng will + động từ nguyên mẫu."],
      ["Our team _____ the new software since March.", "has used", ["has used", "uses by", "using", "will using"], "Cấu trúc: 'since March' là dấu hiệu của hiện tại hoàn thành: has/have + V3."],
      ["The package _____ by courier this morning.", "was delivered", ["was delivered", "delivered", "will delivering", "delivery"], "Cấu trúc: gói hàng nhận hành động giao nên dùng bị động quá khứ: was delivered."],
      ["Employees _____ their badges before entering the building.", "must show", ["must show", "showing", "shown", "must showing"], "Cấu trúc: 'must' diễn tả yêu cầu bắt buộc và đi với động từ nguyên mẫu."],
      ["The printer _____ when the technician arrived.", "was working", ["was working", "works", "has work", "working by"], "Cấu trúc: hành động đang diễn ra tại một thời điểm quá khứ dùng quá khứ tiếp diễn: was/were + V-ing."],
      ["The contract _____ next week after legal review.", "will be signed", ["will be signed", "signing", "has signed", "will signing"], "Cấu trúc: hợp đồng là vật được ký trong tương lai nên dùng tương lai bị động: will be + V3."],
    ],
  },
  {
    title: "TOEIC Grammar - Prepositions",
    description: "Reading Part 5 grammar practice for prepositions, time phrases, and fixed expressions.",
    examTitle: "Grammar Test 02 - Prepositions",
    rows: [
      ["The workshop will take place _____ the third floor.", "on", ["on", "at", "by", "into"], "Cấu trúc: với tầng trong tòa nhà, tiếng Anh dùng giới từ 'on'."],
      ["All employees must register _____ noon on Monday.", "by", ["by", "during", "among", "beside"], "Cấu trúc: 'by + thời điểm' diễn tả hạn chót, nghĩa là muộn nhất trước hoặc đúng thời điểm đó."],
      ["The brochure explains the service _____ clear detail.", "in", ["in", "on", "at", "with"], "Cấu trúc: cụm cố định là 'in detail' hoặc 'in clear detail'."],
      ["Please send the invoice directly _____ the accounting department.", "to", ["to", "over", "from", "between"], "Cấu trúc: 'send something to someone/a department' nghĩa là gửi thứ gì đến ai hoặc bộ phận nào."],
      ["The meeting has been postponed _____ next Thursday.", "until", ["until", "among", "through", "inside"], "Cấu trúc: 'postpone until + thời điểm' nghĩa là hoãn đến thời điểm mới."],
      ["The cafe is located _____ the main entrance and the bookstore.", "between", ["between", "during", "onto", "without"], "Cấu trúc: dùng 'between' khi nói vị trí ở giữa hai địa điểm hoặc hai đối tượng."],
      ["The report was prepared _____ Ms. Chen.", "by", ["by", "at", "with", "under"], "Cấu trúc: trong câu bị động, 'by' giới thiệu người thực hiện hành động."],
      ["The discount is available _____ online orders only.", "for", ["for", "into", "across", "beside"], "Cấu trúc: tính từ 'available' thường đi với 'for' khi nói áp dụng cho đối tượng nào."],
      ["The office will be closed _____ the holiday weekend.", "during", ["during", "onto", "among", "toward"], "Cấu trúc: 'during' dùng với một khoảng thời gian."],
      ["Please check the form _____ submitting it.", "before", ["before", "above", "around", "beyond"], "Cấu trúc: 'before + V-ing' diễn tả việc cần làm trước một hành động khác."],
    ],
  },
  {
    title: "TOEIC Grammar - Connectors",
    description: "Reading Part 6 grammar practice for contrast, cause, result, and sentence logic.",
    examTitle: "Grammar Test 03 - Connectors",
    rows: [
      ["The manager approved the proposal _____ the budget was limited.", "although", ["although", "because", "therefore", "so that"], "Cấu trúc: 'although' nối hai ý tương phản: ngân sách hạn chế nhưng đề xuất vẫn được duyệt."],
      ["The order was delayed _____ a customs form was missing.", "because", ["because", "despite", "unless", "however"], "Cấu trúc: 'because' nối với mệnh đề chỉ nguyên nhân."],
      ["The store extended its hours; _____, sales increased.", "therefore", ["therefore", "unless", "while", "although"], "Cấu trúc: 'therefore' là trạng từ nối chỉ kết quả."],
      ["Please call me _____ you need additional information.", "if", ["if", "so", "but", "nor"], "Cấu trúc: 'if' đưa ra điều kiện cho hành động trong mệnh đề còn lại."],
      ["The product is popular _____ it is easy to use.", "because", ["because", "although", "nevertheless", "unless"], "Cấu trúc: vế sau giải thích lý do sản phẩm phổ biến nên dùng 'because'."],
      ["The room is small; _____, it can hold twenty people.", "however", ["however", "because", "so that", "unless"], "Cấu trúc: 'however' nối hai câu có ý trái ngược."],
      ["We updated the website _____ customers can find prices quickly.", "so that", ["so that", "unless", "even though", "despite"], "Cấu trúc: 'so that' diễn tả mục đích của hành động."],
      ["The shipment arrived early, _____ the team began unpacking it.", "so", ["so", "although", "while", "unless"], "Cấu trúc: 'so' nối nguyên nhân và kết quả trong cùng câu."],
      ["The printer is reliable, _____ it is expensive to maintain.", "but", ["but", "because", "therefore", "since"], "Cấu trúc: 'but' nối hai ý đối lập trong cùng câu."],
      ["Staff may use the lounge _____ it has been reserved for training.", "unless", ["unless", "because", "therefore", "so"], "Cấu trúc: 'unless' nghĩa là 'trừ khi', tương đương 'if not'."],
    ],
  },
  {
    title: "TOEIC Grammar - Word Forms",
    description: "Reading Part 5 grammar practice for nouns, verbs, adjectives, and adverbs in business sentences.",
    examTitle: "Grammar Test 04 - Word Forms",
    rows: [
      ["The new printer is more _____ than the old model.", "reliable", ["reliable", "reliably", "reliance", "rely"], "Cấu trúc: sau 'more' trong so sánh cần tính từ, nên chọn 'reliable'."],
      ["Please review the document _____ before signing it.", "carefully", ["carefully", "careful", "care", "carefulness"], "Cấu trúc: từ cần điền bổ nghĩa cho động từ 'review', vì vậy cần trạng từ 'carefully'."],
      ["The board made a final _____ yesterday.", "decision", ["decision", "decide", "decisive", "decisively"], "Cấu trúc: sau tính từ 'final' cần danh từ, nên chọn 'decision'."],
      ["The training session was very _____.", "informative", ["informative", "information", "inform", "informatively"], "Cấu trúc: sau 'was very' cần tính từ mô tả chủ ngữ, nên chọn 'informative'."],
      ["The team will _____ the new policy next month.", "implement", ["implement", "implementation", "implemented", "implementing"], "Cấu trúc: sau 'will' dùng động từ nguyên mẫu, nên chọn 'implement'."],
      ["Customer _____ is a priority for our department.", "satisfaction", ["satisfaction", "satisfy", "satisfied", "satisfying"], "Cấu trúc: vị trí chủ ngữ cần danh từ, nên chọn 'satisfaction'."],
      ["The instructions were written _____.", "clearly", ["clearly", "clear", "clarity", "clearance"], "Cấu trúc: từ cần điền bổ nghĩa cho động từ bị động 'were written', nên cần trạng từ 'clearly'."],
      ["The company announced a major _____ in service quality.", "improvement", ["improvement", "improve", "improved", "improving"], "Cấu trúc: sau tính từ 'major' cần danh từ, nên chọn 'improvement'."],
      ["The assistant responded _____ to every customer.", "politely", ["politely", "polite", "politeness", "politer"], "Cấu trúc: từ cần điền mô tả cách phản hồi nên dùng trạng từ 'politely'."],
      ["The report includes a _____ summary of expenses.", "detailed", ["detailed", "detail", "details", "detailing"], "Cấu trúc: trước danh từ 'summary' cần tính từ, nên chọn 'detailed'."],
    ],
  },
] as const;

const LISTENING_EXAMS = [
  {
    title: "TOEIC Listening - Office Requests",
    description: "Listening practice for short workplace requests, printing, reports, deliveries, and meeting rooms.",
    examTitle: "Listening Test 01 - Office Requests",
    rows: [
      ["What does the speaker ask for?", "A printed agenda", ["A printed agenda", "A parking pass", "A new laptop", "A lunch reservation"], "Could you print the agenda before the client meeting starts?", "Giải thích: người nói dùng 'Could you print...' để yêu cầu in agenda."],
      ["When should the report be sent?", "Before noon", ["Before noon", "After dinner", "Next month", "At the airport"], "Please send the updated sales report before noon today.", "Giải thích: cụm thời gian cần bắt là 'before noon today'."],
      ["Where should the boxes be placed?", "Near the reception desk", ["Near the reception desk", "Inside the elevator", "Behind the restaurant", "At the train station"], "Please leave the delivery boxes near the reception desk.", "Giải thích: địa điểm đúng là 'near the reception desk'."],
      ["Who is the message for?", "The training team", ["The training team", "The hotel guest", "A taxi driver", "A supplier"], "This reminder is for the training team preparing room 204.", "Giải thích: cụm 'for the training team' cho biết người nhận thông báo."],
      ["What does the speaker need changed?", "The meeting time", ["The meeting time", "The printer password", "The lunch menu", "The invoice number"], "Could we move tomorrow's meeting from nine to ten thirty?", "Giải thích: người nói muốn đổi giờ họp từ 9:00 sang 10:30."],
    ],
  },
  {
    title: "TOEIC Listening - Announcements",
    description: "Listening practice for announcements about entrances, trains, reports, events, and weather changes.",
    examTitle: "Listening Test 02 - Announcements",
    rows: [
      ["What will be closed today?", "The east entrance", ["The east entrance", "The parking garage", "The cafeteria", "The finance office"], "The east entrance will be closed today for sidewalk repairs.", "Giải thích: thông tin chính là 'The east entrance will be closed'."],
      ["Where should passengers go?", "Platform three", ["Platform three", "Gate twelve", "Room 315", "The front desk"], "Train 406 to Riverside is now boarding at platform three.", "Giải thích: cụm 'boarding at platform three' chỉ nơi hành khách cần đến."],
      ["What is due Friday?", "Quarterly reports", ["Quarterly reports", "Conference badges", "Hotel keys", "Meal tickets"], "Quarterly reports are due Friday and must be uploaded online.", "Giải thích: cụm 'Quarterly reports are due Friday' trả lời trực tiếp."],
      ["Why is the picnic moving indoors?", "Rain is expected", ["Rain is expected", "The room is full", "Lunch is delayed", "Tickets sold out"], "Because rain is expected, the company picnic will move inside.", "Giải thích: từ 'because' báo hiệu nguyên nhân là trời có thể mưa."],
      ["What should visitors bring?", "Their tickets", ["Their tickets", "A toolbox", "A signed contract", "A hotel key"], "Visitors should bring their tickets and enter through the main lobby.", "Giải thích: đáp án nằm sau 'should bring': their tickets."],
    ],
  },
  {
    title: "TOEIC Listening - Customer Service",
    description: "Listening practice for customer service calls, refunds, appointments, product information, and store hours.",
    examTitle: "Listening Test 03 - Customer Service",
    rows: [
      ["Why is the customer calling?", "To change an appointment", ["To change an appointment", "To buy a printer", "To reserve a hotel room", "To join a tour"], "I need to change my appointment from Tuesday afternoon to Wednesday morning.", "Giải thích: người gọi nói 'need to change my appointment', nên mục đích là đổi lịch hẹn."],
      ["What does the employee offer to send?", "A receipt", ["A receipt", "A map", "A badge", "A menu"], "I can email you a copy of the receipt this afternoon.", "Giải thích: nhân viên đề nghị gửi bản sao hóa đơn qua email."],
      ["What item is unavailable?", "The blue jacket", ["The blue jacket", "The black suitcase", "The tablet charger", "The office chair"], "The blue jacket is currently unavailable, but we have it in gray.", "Giải thích: từ khóa 'currently unavailable' đi với 'the blue jacket'."],
      ["When does the store close?", "At seven", ["At seven", "At nine thirty", "At noon", "At six in the morning"], "Our downtown store closes at seven on weekdays.", "Giải thích: câu trả lời là thời gian sau động từ 'closes': at seven."],
      ["What will the customer receive?", "A replacement part", ["A replacement part", "A training certificate", "A new brochure", "A parking ticket"], "We will send a replacement part by express delivery.", "Giải thích: khách hàng sẽ nhận 'a replacement part'."],
    ],
  },
  {
    title: "TOEIC Listening - Travel and Scheduling",
    description: "Listening practice for travel plans, hotel check-in, schedule changes, taxis, and conference logistics.",
    examTitle: "Listening Test 04 - Travel and Scheduling",
    rows: [
      ["What time is the flight now scheduled to leave?", "At six forty-five", ["At six forty-five", "At eight fifteen", "At noon", "At ten thirty"], "The flight is now scheduled to leave at six forty-five.", "Giải thích: cụm 'scheduled to leave at six forty-five' cho biết giờ bay mới."],
      ["Where will the guest check in?", "At the front desk", ["At the front desk", "At platform three", "In the warehouse", "Near the printer"], "Please check in at the front desk when you arrive.", "Giải thích: địa điểm check-in là 'at the front desk'."],
      ["What does the speaker want reserved?", "A taxi", ["A taxi", "A training room", "A printer", "A lunch box"], "Could you reserve a taxi for seven tomorrow morning?", "Giải thích: người nói yêu cầu đặt taxi."],
      ["Why was the schedule changed?", "A speaker is delayed", ["A speaker is delayed", "The invoice is wrong", "The package arrived", "The hotel is full"], "The afternoon schedule changed because one speaker is delayed.", "Giải thích: từ 'because' đưa ra lý do là một diễn giả bị trễ."],
      ["What should attendees pick up?", "Conference badges", ["Conference badges", "Office keys", "Travel refunds", "Shipping labels"], "Attendees can pick up their conference badges at registration.", "Giải thích: người tham dự cần nhận 'conference badges'."],
    ],
  },
] as const;

const TOPIC_SEEDS: TopicSeed[] = [
  ...GRAMMAR_EXAMS.map((exam) => ({
    title: exam.title,
    description: exam.description,
    type: TopicType.GRAMMAR,
    examTitle: exam.examTitle,
    questions: exam.rows.map(([content, correctAnswer, options, explanation]) =>
      grammarQuestion(content, correctAnswer, options, explanation)
    ),
  })),
  ...LISTENING_EXAMS.map((exam, examIndex) => ({
    title: exam.title,
    description: exam.description,
    type: TopicType.LISTENING,
    examTitle: exam.examTitle,
    questions: exam.rows.map(([content, correctAnswer, options, transcript, explanation], questionIndex) =>
      listeningQuestion(content, correctAnswer, options, AUDIO_URLS[examIndex * 5 + questionIndex], transcript, explanation)
    ),
  })),
];

function grammarQuestion(
  content: string,
  correctAnswer: string,
  options: readonly string[],
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
  options: readonly string[],
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

function makeOptions(correctAnswer: string, options: readonly string[]): OptionSeed[] {
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
      category: topicType === TopicType.LISTENING ? QuestionCategory.LISTENING : QuestionCategory.GRAMMAR,
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

      const exam = await manager.save(
        manager.create(Exam, {
          topicId: topic.id,
          title: topicSeed.examTitle,
          isActive: true,
        })
      );

      for (let index = 0; index < topicSeed.questions.length; index += 1) {
        await createQuestion(manager, exam.id, topicSeed.type, index + 1, topicSeed.questions[index]);
      }
    }
  });

  const [topics, seededExams, seededQuestions] = await Promise.all([
    AppDataSource.getRepository(Topic)
      .createQueryBuilder("topic")
      .where("topic.title LIKE :title", { title: `${SEED_PREFIX}%` })
      .getCount(),
    AppDataSource.getRepository(Exam)
      .createQueryBuilder("exam")
      .innerJoin(Topic, "topic", "topic.id = exam.topicId")
      .where("topic.title LIKE :title", { title: `${SEED_PREFIX}%` })
      .getCount(),
    AppDataSource.getRepository(Question)
      .createQueryBuilder("question")
      .innerJoin(ExamQuestion, "examQuestion", "examQuestion.questionId = question.id")
      .innerJoin(Exam, "exam", "exam.id = examQuestion.examId")
      .innerJoin(Topic, "topic", "topic.id = exam.topicId")
      .where("topic.title LIKE :title", { title: `${SEED_PREFIX}%` })
      .getCount(),
  ]);

  console.log(`[topic-seed] Seeded topics=${topics}; exams=${seededExams}; questions=${seededQuestions}`);
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
