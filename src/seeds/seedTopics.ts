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
    description:
      "Reading Part 5 grammar practice for verb tense, passive voice, and office deadlines.",
    examTitle: "Grammar Test 01 - Verb Tenses",
    rows: [
      ["The finance team _____ the quarterly report by Friday.", "must submit", ["must submit", "submitting", "submit to", "has submitting"], "Sau modal verb 'must' dùng động từ nguyên mẫu. Nếu sai, hãy ôn cấu trúc modal + V trong TOEIC Part 5."],
      ["Ms. Lin _____ the client before the meeting started.", "had called", ["had called", "has call", "calling", "will calling"], "Hành động gọi khách hàng xảy ra trước một mốc quá khứ khác nên dùng quá khứ hoàn thành. Nếu sai, hãy ôn past perfect và dấu hiệu 'before'."],
      ["The updated schedule _____ to all employees yesterday.", "was sent", ["was sent", "sent", "will send", "sending"], "Lịch trình là vật nhận hành động nên cần câu bị động; 'yesterday' dùng quá khứ đơn bị động: was/were + V3. Nếu sai, hãy ôn passive voice."],
      ["Please let us know if the shipment _____ late.", "arrives", ["arrives", "arrive", "arriving", "arrival"], "Mệnh đề điều kiện loại 1 sau 'if' dùng hiện tại đơn. Nếu sai, hãy ôn cấu trúc if + present simple, will/can/may + V."],
      ["The director _____ the proposal at tomorrow's meeting.", "will review", ["will review", "reviewing", "has review", "reviewed by"], "'Tomorrow' chỉ tương lai nên dùng will + động từ nguyên mẫu. Nếu sai, hãy ôn thì tương lai đơn trong ngữ cảnh lịch họp."],
      ["Our team _____ the new software since March.", "has used", ["has used", "uses by", "using", "will using"], "'Since March' diễn tả hành động bắt đầu trong quá khứ và còn liên quan hiện tại nên dùng hiện tại hoàn thành. Nếu sai, hãy ôn present perfect với since/for."],
      ["The package _____ by courier this morning.", "was delivered", ["was delivered", "delivered", "will delivering", "delivery"], "Gói hàng nhận hành động giao nên cần bị động quá khứ: was delivered. Nếu sai, hãy ôn cách nhận diện chủ ngữ là vật trong câu bị động."],
      ["Employees _____ their badges before entering the building.", "must show", ["must show", "showing", "shown", "must showing"], "'Must' diễn tả yêu cầu bắt buộc và luôn đi với động từ nguyên mẫu. Nếu sai, hãy ôn modal verbs trong nội quy công ty."],
      ["The printer _____ when the technician arrived.", "was working", ["was working", "works", "has work", "working by"], "Một hành động đang diễn ra tại thời điểm một hành động quá khứ khác xảy ra nên dùng quá khứ tiếp diễn. Nếu sai, hãy ôn past continuous với 'when'."],
      ["The contract _____ next week after legal review.", "will be signed", ["will be signed", "signing", "has signed", "will signing"], "Hợp đồng là vật được ký trong tương lai nên dùng tương lai bị động: will be + V3. Nếu sai, hãy ôn future passive."],
    ],
  },
  {
    title: "TOEIC Grammar - Prepositions",
    description:
      "Reading Part 5 grammar practice for prepositions, time phrases, and fixed expressions.",
    examTitle: "Grammar Test 02 - Prepositions",
    rows: [
      ["The workshop will take place _____ the third floor.", "on", ["on", "at", "by", "into"], "Với tầng trong tòa nhà, tiếng Anh dùng giới từ 'on'. Nếu sai, hãy ôn prepositions chỉ địa điểm: on/at/in."],
      ["All employees must register _____ noon on Monday.", "by", ["by", "during", "among", "beside"], "'By noon' nghĩa là muộn nhất trước hoặc đúng trưa, dùng cho hạn chót. Nếu sai, hãy ôn by/until/during trong mốc thời gian."],
      ["The brochure explains the service _____ clear detail.", "in", ["in", "on", "at", "with"], "Cụm cố định là 'in detail' hoặc 'in clear detail'. Nếu sai, hãy ôn collocation với giới từ trong văn phòng."],
      ["Please send the invoice directly _____ the accounting department.", "to", ["to", "over", "from", "between"], "Động từ 'send' thường đi với 'to' khi nói gửi đến một người/bộ phận. Nếu sai, hãy ôn verb + preposition."],
      ["The meeting has been postponed _____ next Thursday.", "until", ["until", "among", "through", "inside"], "'Postpone until' nghĩa là hoãn đến một thời điểm mới. Nếu sai, hãy ôn giới từ thời gian dùng với lịch họp."],
      ["The cafe is located _____ the main entrance and the bookstore.", "between", ["between", "during", "onto", "without"], "Có hai địa điểm được nhắc đến nên dùng 'between'. Nếu sai, hãy ôn between/among."],
      ["The report was prepared _____ Ms. Chen.", "by", ["by", "at", "with", "under"], "Trong câu bị động, 'by' giới thiệu người thực hiện hành động. Nếu sai, hãy ôn passive voice với by + agent."],
      ["The discount is available _____ online orders only.", "for", ["for", "into", "across", "beside"], "Cụm đúng là 'available for' khi nói áp dụng cho đối tượng nào. Nếu sai, hãy ôn adjective + preposition."],
      ["The office will be closed _____ the holiday weekend.", "during", ["during", "onto", "among", "toward"], "'During' dùng cho một khoảng thời gian. Nếu sai, hãy ôn during/for/while."],
      ["Please check the form _____ submitting it.", "before", ["before", "above", "around", "beyond"], "'Before + V-ing' diễn tả việc cần làm trước hành động khác. Nếu sai, hãy ôn liên từ/giới từ chỉ trình tự."],
    ],
  },
  {
    title: "TOEIC Grammar - Connectors",
    description:
      "Reading Part 6 grammar practice for contrast, cause, result, and sentence logic.",
    examTitle: "Grammar Test 03 - Connectors",
    rows: [
      ["The manager approved the proposal _____ the budget was limited.", "although", ["although", "because", "therefore", "so that"], "'Although' nối hai ý tương phản: ngân sách hạn chế nhưng đề xuất vẫn được duyệt. Nếu sai, hãy ôn connectors chỉ tương phản."],
      ["The order was delayed _____ a customs form was missing.", "because", ["because", "despite", "unless", "however"], "Vế sau nêu nguyên nhân đơn hàng bị trễ nên dùng 'because'. Nếu sai, hãy ôn connectors chỉ nguyên nhân."],
      ["The store extended its hours; _____, sales increased.", "therefore", ["therefore", "unless", "while", "although"], "'Therefore' diễn tả kết quả của việc mở cửa lâu hơn. Nếu sai, hãy ôn trạng từ nối chỉ kết quả."],
      ["Please call me _____ you need additional information.", "if", ["if", "so", "but", "nor"], "'If' đưa ra điều kiện: nếu cần thêm thông tin thì gọi. Nếu sai, hãy ôn mệnh đề điều kiện cơ bản."],
      ["The product is popular _____ it is easy to use.", "because", ["because", "although", "nevertheless", "unless"], "Vế sau giải thích lý do sản phẩm phổ biến nên dùng 'because'. Nếu sai, hãy ôn cách phân biệt reason và contrast."],
      ["The room is small; _____, it can hold twenty people.", "however", ["however", "because", "so that", "unless"], "'However' nối hai câu có ý trái ngược: phòng nhỏ nhưng chứa được 20 người. Nếu sai, hãy ôn however/nevertheless."],
      ["We updated the website _____ customers can find prices quickly.", "so that", ["so that", "unless", "even though", "despite"], "'So that' diễn tả mục đích của việc cập nhật website. Nếu sai, hãy ôn connectors chỉ mục đích."],
      ["The shipment arrived early, _____ the team began unpacking it.", "so", ["so", "although", "while", "unless"], "'So' nối nguyên nhân và kết quả trong cùng câu. Nếu sai, hãy ôn so/therefore."],
      ["The printer is reliable, _____ it is expensive to maintain.", "but", ["but", "because", "therefore", "since"], "'But' nối hai ý đối lập: đáng tin cậy nhưng tốn phí bảo trì. Nếu sai, hãy ôn coordinating conjunctions."],
      ["Staff may use the lounge _____ it has been reserved for training.", "unless", ["unless", "because", "therefore", "so"], "'Unless' nghĩa là trừ khi; nhân viên dùng được phòng chờ trừ khi phòng đã được đặt. Nếu sai, hãy ôn unless = if not."],
    ],
  },
  {
    title: "TOEIC Grammar - Word Forms",
    description:
      "Reading Part 5 grammar practice for nouns, verbs, adjectives, and adverbs in business sentences.",
    examTitle: "Grammar Test 04 - Word Forms",
    rows: [
      ["The new printer is more _____ than the old model.", "reliable", ["reliable", "reliably", "reliance", "rely"], "Sau 'more' trong cấu trúc so sánh cần tính từ, nên chọn 'reliable'. Nếu sai, hãy ôn word forms: adjective/adverb/noun/verb."],
      ["Please review the document _____ before signing it.", "carefully", ["carefully", "careful", "care", "carefulness"], "Từ cần điền bổ nghĩa cho động từ 'review', vì vậy cần trạng từ 'carefully'. Nếu sai, hãy ôn adverb kết thúc bằng -ly."],
      ["The board made a final _____ yesterday.", "decision", ["decision", "decide", "decisive", "decisively"], "Sau tính từ 'final' cần danh từ, nên chọn 'decision'. Nếu sai, hãy ôn vị trí danh từ sau tính từ."],
      ["The training session was very _____.", "informative", ["informative", "information", "inform", "informatively"], "Sau 'was very' cần tính từ mô tả chủ ngữ, nên chọn 'informative'. Nếu sai, hãy ôn cấu trúc be + adjective."],
      ["The team will _____ the new policy next month.", "implement", ["implement", "implementation", "implemented", "implementing"], "Sau 'will' dùng động từ nguyên mẫu, nên chọn 'implement'. Nếu sai, hãy ôn modal/future + base verb."],
      ["Customer _____ is a priority for our department.", "satisfaction", ["satisfaction", "satisfy", "satisfied", "satisfying"], "Vị trí chủ ngữ cần danh từ, nên chọn 'satisfaction'. Nếu sai, hãy ôn noun forms trong TOEIC Part 5."],
      ["The instructions were written _____.", "clearly", ["clearly", "clear", "clarity", "clearance"], "Từ cần điền bổ nghĩa cho động từ bị động 'were written', nên cần trạng từ 'clearly'. Nếu sai, hãy ôn adverb placement."],
      ["The company announced a major _____ in service quality.", "improvement", ["improvement", "improve", "improved", "improving"], "Sau tính từ 'major' cần danh từ, nên chọn 'improvement'. Nếu sai, hãy ôn hậu tố danh từ như -ment."],
      ["The assistant responded _____ to every customer.", "politely", ["politely", "polite", "politeness", "politer"], "Từ cần điền mô tả cách phản hồi nên dùng trạng từ 'politely'. Nếu sai, hãy ôn adjective vs adverb."],
      ["The report includes a _____ summary of expenses.", "detailed", ["detailed", "detail", "details", "detailing"], "Trước danh từ 'summary' cần tính từ, nên chọn 'detailed'. Nếu sai, hãy ôn adjective đứng trước noun."],
    ],
  },
] as const;

const LISTENING_EXAMS = [
  {
    title: "TOEIC Listening - Office Requests",
    description:
      "Listening practice for short workplace requests, printing, reports, deliveries, and meeting rooms.",
    examTitle: "Listening Test 01 - Office Requests",
    rows: [
      ["What does the speaker ask for?", "A printed agenda", ["A printed agenda", "A parking pass", "A new laptop", "A lunch reservation"], "Could you print the agenda before the client meeting starts?", "Người nói dùng 'Could you print...' để yêu cầu in agenda. Nếu sai, hãy ôn cách nghe từ khóa yêu cầu như print, send, reserve."],
      ["When should the report be sent?", "Before noon", ["Before noon", "After dinner", "Next month", "At the airport"], "Please send the updated sales report before noon today.", "Cụm thời gian cần bắt là 'before noon today'. Nếu sai, hãy ôn nghe mốc thời gian và deadline trong TOEIC."],
      ["Where should the boxes be placed?", "Near the reception desk", ["Near the reception desk", "Inside the elevator", "Behind the restaurant", "At the train station"], "Please leave the delivery boxes near the reception desk.", "Địa điểm đúng là 'near the reception desk'. Nếu sai, hãy ôn giới từ vị trí và danh từ văn phòng."],
      ["Who is the message for?", "The training team", ["The training team", "The hotel guest", "A taxi driver", "A supplier"], "This reminder is for the training team preparing room 204.", "Cụm 'for the training team' cho biết người nhận thông báo. Nếu sai, hãy ôn câu hỏi Who và từ khóa chỉ người/bộ phận."],
      ["What does the speaker need changed?", "The meeting time", ["The meeting time", "The printer password", "The lunch menu", "The invoice number"], "Could we move tomorrow's meeting from nine to ten thirty?", "Người nói muốn đổi giờ họp từ 9:00 sang 10:30. Nếu sai, hãy ôn cụm 'move a meeting' và cách nghe thay đổi lịch."],
    ],
  },
  {
    title: "TOEIC Listening - Announcements",
    description:
      "Listening practice for announcements about entrances, trains, reports, events, and weather changes.",
    examTitle: "Listening Test 02 - Announcements",
    rows: [
      ["What will be closed today?", "The east entrance", ["The east entrance", "The parking garage", "The cafeteria", "The finance office"], "The east entrance will be closed today for sidewalk repairs.", "Thông tin chính là 'The east entrance will be closed'. Nếu sai, hãy ôn nghe danh từ đứng trước 'will be closed'."],
      ["Where should passengers go?", "Platform three", ["Platform three", "Gate twelve", "Room 315", "The front desk"], "Train 406 to Riverside is now boarding at platform three.", "Cụm 'boarding at platform three' chỉ nơi hành khách cần đến. Nếu sai, hãy ôn từ vựng giao thông: platform, gate, lobby."],
      ["What is due Friday?", "Quarterly reports", ["Quarterly reports", "Conference badges", "Hotel keys", "Meal tickets"], "Quarterly reports are due Friday and must be uploaded online.", "Cụm 'Quarterly reports are due Friday' trả lời trực tiếp. Nếu sai, hãy ôn nghe cấu trúc be due + thời gian."],
      ["Why is the picnic moving indoors?", "Rain is expected", ["Rain is expected", "The room is full", "Lunch is delayed", "Tickets sold out"], "Because rain is expected, the company picnic will move inside.", "Từ 'because' báo hiệu nguyên nhân: trời có thể mưa. Nếu sai, hãy ôn câu hỏi Why và tín hiệu nguyên nhân."],
      ["What should visitors bring?", "Their tickets", ["Their tickets", "A toolbox", "A signed contract", "A hotel key"], "Visitors should bring their tickets and enter through the main lobby.", "Đáp án nằm sau 'should bring': their tickets. Nếu sai, hãy ôn modal 'should' trong hướng dẫn/thông báo."],
    ],
  },
  {
    title: "TOEIC Listening - Customer Service",
    description:
      "Listening practice for customer service calls, refunds, appointments, product information, and store hours.",
    examTitle: "Listening Test 03 - Customer Service",
    rows: [
      ["Why is the customer calling?", "To change an appointment", ["To change an appointment", "To buy a printer", "To reserve a hotel room", "To join a tour"], "I need to change my appointment from Tuesday afternoon to Wednesday morning.", "Người gọi nói 'need to change my appointment', nên mục đích là đổi lịch hẹn. Nếu sai, hãy ôn nghe mục đích cuộc gọi."],
      ["What does the employee offer to send?", "A receipt", ["A receipt", "A map", "A badge", "A menu"], "I can email you a copy of the receipt this afternoon.", "Nhân viên đề nghị gửi bản sao hóa đơn qua email. Nếu sai, hãy ôn cụm 'email/send a copy of...'."],
      ["What item is unavailable?", "The blue jacket", ["The blue jacket", "The black suitcase", "The tablet charger", "The office chair"], "The blue jacket is currently unavailable, but we have it in gray.", "Từ khóa 'currently unavailable' đi với 'the blue jacket'. Nếu sai, hãy ôn nghe trạng thái hàng hóa."],
      ["When does the store close?", "At seven", ["At seven", "At nine thirty", "At noon", "At six in the morning"], "Our downtown store closes at seven on weekdays.", "Câu trả lời là thời gian sau động từ 'closes': at seven. Nếu sai, hãy ôn nghe giờ đóng/mở cửa."],
      ["What will the customer receive?", "A replacement part", ["A replacement part", "A training certificate", "A new brochure", "A parking ticket"], "We will send a replacement part by express delivery.", "Khách hàng sẽ nhận 'a replacement part'. Nếu sai, hãy ôn từ vựng bảo hành và giao hàng."],
    ],
  },
  {
    title: "TOEIC Listening - Travel and Scheduling",
    description:
      "Listening practice for travel plans, hotel check-in, schedule changes, taxis, and conference logistics.",
    examTitle: "Listening Test 04 - Travel and Scheduling",
    rows: [
      ["What time is the flight now scheduled to leave?", "At six forty-five", ["At six forty-five", "At eight fifteen", "At noon", "At ten thirty"], "The flight is now scheduled to leave at six forty-five.", "Cụm 'scheduled to leave at six forty-five' cho biết giờ bay mới. Nếu sai, hãy ôn nghe giờ và cụm scheduled to."],
      ["Where will the guest check in?", "At the front desk", ["At the front desk", "At platform three", "In the warehouse", "Near the printer"], "Please check in at the front desk when you arrive.", "Địa điểm check-in là 'at the front desk'. Nếu sai, hãy ôn từ vựng khách sạn và cụm check in at."],
      ["What does the speaker want reserved?", "A taxi", ["A taxi", "A training room", "A printer", "A lunch box"], "Could you reserve a taxi for seven tomorrow morning?", "Người nói yêu cầu đặt taxi. Nếu sai, hãy ôn động từ 'reserve' và danh từ dịch vụ đi lại."],
      ["Why was the schedule changed?", "A speaker is delayed", ["A speaker is delayed", "The invoice is wrong", "The package arrived", "The hotel is full"], "The afternoon schedule changed because one speaker is delayed.", "Từ 'because' đưa ra lý do: một diễn giả bị trễ. Nếu sai, hãy ôn câu hỏi Why trong thông báo lịch trình."],
      ["What should attendees pick up?", "Conference badges", ["Conference badges", "Office keys", "Travel refunds", "Shipping labels"], "Attendees can pick up their conference badges at registration.", "Người tham dự cần nhận 'conference badges'. Nếu sai, hãy ôn cụm pick up và từ vựng hội nghị."],
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
      listeningQuestion(
        content,
        correctAnswer,
        options,
        AUDIO_URLS[examIndex * 5 + questionIndex],
        transcript,
        explanation
      )
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

      const exam = await manager.save(
        manager.create(Exam, {
          topicId: topic.id,
          title: topicSeed.examTitle,
          isActive: true,
        })
      );

      for (let index = 0; index < topicSeed.questions.length; index += 1) {
        await createQuestion(
          manager,
          exam.id,
          topicSeed.type,
          index + 1,
          topicSeed.questions[index]
        );
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

  console.log(
    `[topic-seed] Seeded topics=${topics}; exams=${seededExams}; questions=${seededQuestions}`
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
