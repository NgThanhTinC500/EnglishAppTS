import "dotenv/config";
import { EntityManager } from "typeorm";
import { AppDataSource } from "../data-source";
import { ToeicCollection } from "../entity/ToeicCollection";
import { ToeicExamPart } from "../entity/ToeicExamPart";
import { ToeicExamSet } from "../entity/ToeicExamSet";
import { ToeicQuestion } from "../entity/ToeicQuestion";
import { ToeicQuestionGroup } from "../entity/ToeicQuestionGroup";
import { ToeicQuestionGroupImage } from "../entity/ToeicQuestionGroupImage";
import {
  ToeicOptionLabel,
  ToeicQuestionOption,
} from "../entity/ToeicQuestionOption";

const COLLECTION_TITLE = "TOEIC Practice Set - Render Seed";
const EXAM_SET_TITLE = "Full TOEIC Practice Test 01";

const PART_RULES = {
  1: { questionCount: 6, durationSeconds: 6 * 60 },
  2: { questionCount: 25, durationSeconds: 15 * 60 },
  3: { questionCount: 39, durationSeconds: 17 * 60 },
  4: { questionCount: 30, durationSeconds: 16 * 60 },
  5: { questionCount: 30, durationSeconds: null },
  6: { questionCount: 16, durationSeconds: null },
  7: { questionCount: 54, durationSeconds: null },
} as const;

type OptionInput = {
  label: ToeicOptionLabel;
  content: string;
  isCorrect?: boolean;
};

type QuestionInput = {
  number: number;
  content: string | null;
  explanation: string;
  options: OptionInput[];
};

type GroupInput = {
  audioText?: string;
  imageUrl?: string;
  passageTitle?: string;
  passageLines?: string[];
  explanation?: string;
  questions: QuestionInput[];
};

type ClozeRow = [string, string, string, string[]];
type PassageQuestionRow = [string, string, string[]];

const labels4 = [
  ToeicOptionLabel.A,
  ToeicOptionLabel.B,
  ToeicOptionLabel.C,
  ToeicOptionLabel.D,
];

const labels3 = [
  ToeicOptionLabel.A,
  ToeicOptionLabel.B,
  ToeicOptionLabel.C,
];

function ttsUrl(text: string) {
  return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(text)}`;
}

function passageImage(title: string, lines: string[]) {
  const escapedTitle = escapeXml(title);
  const lineNodes = lines
    .flatMap((line) => wrapText(line, 68))
    .map((line, index) => {
      const y = 92 + index * 32;
      return `<text x="52" y="${y}" font-size="21" fill="#1f2937">${escapeXml(line)}</text>`;
    })
    .join("");

  const height = Math.max(420, 150 + lines.length * 58);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="${height}" viewBox="0 0 900 ${height}">
<rect width="900" height="${height}" fill="#ffffff"/>
<rect x="28" y="28" width="844" height="${height - 56}" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
<text x="52" y="62" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="#0f172a">${escapedTitle}</text>
<g font-family="Arial, Helvetica, sans-serif">${lineNodes}</g>
</svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(text: string, maxLength: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) lines.push(current);
  return lines;
}

function options(
  correctLabel: ToeicOptionLabel,
  choices: Record<ToeicOptionLabel, string>
) {
  return Object.values(ToeicOptionLabel)
    .filter((label) => choices[label])
    .map((label) => ({
      label,
      content: choices[label],
      isCorrect: label === correctLabel,
    }));
}

function simpleOptions(correctIndex: number, values: string[], optionLabels = labels4) {
  return optionLabels.map((label, index) => ({
    label,
    content: values[index],
    isCorrect: index === correctIndex,
  }));
}

const part1Photos = [
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=900&q=80",
];

function buildPart1(): GroupInput[] {
  const scenes = [
    {
      audio: "A man is arranging documents on a desk.",
      question: "Look at the picture and choose the statement that best describes it.",
      choices: [
        "A man is arranging documents on a desk.",
        "A woman is boarding a train.",
        "Several boxes are being loaded into a truck.",
        "The chairs have been stacked outside.",
      ],
    },
    {
      audio: "Several people are sitting around a conference table.",
      question: "Look at the picture and choose the statement that best describes it.",
      choices: [
        "The room is empty.",
        "Several people are sitting around a conference table.",
        "A worker is repairing a window.",
        "A customer is paying at a counter.",
      ],
    },
    {
      audio: "Two coworkers are reviewing information on a laptop.",
      question: "Look at the picture and choose the statement that best describes it.",
      choices: [
        "Two coworkers are reviewing information on a laptop.",
        "The shelves are being painted.",
        "A vehicle is parked beside a gate.",
        "The lights have been turned off.",
      ],
    },
    {
      audio: "A group of employees is walking through an office.",
      question: "Look at the picture and choose the statement that best describes it.",
      choices: [
        "A group of employees is walking through an office.",
        "A waiter is clearing plates.",
        "Some luggage is being weighed.",
        "A printer is being installed.",
      ],
    },
    {
      audio: "Chairs and tables have been set up outdoors.",
      question: "Look at the picture and choose the statement that best describes it.",
      choices: [
        "Chairs and tables have been set up outdoors.",
        "A receipt is being signed.",
        "Some passengers are entering an elevator.",
        "The ceiling is being repaired.",
      ],
    },
    {
      audio: "A customer is speaking with an employee at a counter.",
      question: "Look at the picture and choose the statement that best describes it.",
      choices: [
        "A customer is speaking with an employee at a counter.",
        "The road is covered with snow.",
        "Several books are stacked on the floor.",
        "A gardener is watering plants.",
      ],
    },
  ];

  return scenes.map((scene, index) => ({
    audioText: scene.audio,
    imageUrl: part1Photos[index],
    explanation: scene.audio,
    questions: [
      {
        number: index + 1,
        content: scene.question,
        explanation: "The correct statement matches the main action in the picture.",
        options: simpleOptions(0, scene.choices),
      },
    ],
  }));
}

function buildPart2(): GroupInput[] {
  const prompts = [
    ["When will the design meeting start?", "At ten thirty.", "In the main folder.", "A new designer."],
    ["Who approved the travel budget?", "Ms. Park did.", "It was very comfortable.", "For three nights."],
    ["Where should I leave these invoices?", "On Martin's desk.", "They cost twelve dollars.", "Yes, I can drive."],
    ["Could you print the agenda?", "Sure, I will do it now.", "The printer was expensive.", "It is near the station."],
    ["Why was the shipment delayed?", "Because a form was missing.", "About twenty boxes.", "To the warehouse."],
    ["Have you called the client yet?", "Yes, I spoke with her this morning.", "The call is on line two.", "A client list."],
    ["Which report should I review first?", "The quarterly sales report.", "It is due tomorrow.", "By email, please."],
    ["How long does the training session last?", "About two hours.", "In room 408.", "The new employees."],
    ["Is the café open after six?", "I think it closes at seven.", "A cup of tea.", "At the front desk."],
    ["Would you like me to reserve a taxi?", "Yes, that would be helpful.", "The hotel lobby.", "A receipt, please."],
    ["Where can I find the supply cabinet?", "Next to the copy room.", "We ordered paper.", "No, it is not heavy."],
    ["Did anyone respond to the survey?", "More than fifty people did.", "It was sent yesterday.", "A marketing survey."],
    ["Why don't we move the display closer to the entrance?", "Good idea; customers will see it first.", "The entrance fee is low.", "A glass display case."],
    ["How many chairs do we need?", "At least forty.", "They are comfortable.", "Near the stage."],
    ["Can you update the mailing list?", "I already added the new addresses.", "A mailing envelope.", "The list is printed in blue."],
    ["Who is leading the workshop?", "Daniel from accounting.", "In the training center.", "It starts on Monday."],
    ["When are the contracts due?", "By the end of the week.", "The legal department.", "Three copies."],
    ["Do you want the receipt emailed or printed?", "Please email it to me.", "It was very expensive.", "At the cashier's desk."],
    ["Where is the nearest bus stop?", "Across from the bank.", "The bus was late.", "At eight fifteen."],
    ["Should we order more brochures?", "Yes, only a few are left.", "They look colorful.", "The order number is B14."],
    ["Who fixed the projector?", "The technician came this morning.", "It projects clearly.", "In the small conference room."],
    ["How often is the inventory checked?", "Every Friday afternoon.", "By the warehouse team.", "About five shelves."],
    ["Can I speak with the manager?", "She is meeting a supplier right now.", "A management course.", "It was managed well."],
    ["Why is the lobby so crowded?", "A tour group just arrived.", "It is on the first floor.", "The lobby has new furniture."],
    ["Would Friday be a good day for the interview?", "Friday morning works for me.", "The interviewer was friendly.", "It is a technical position."],
  ];

  return prompts.map((item, index) => ({
    audioText: item[0],
    explanation: item[0],
    questions: [
      {
        number: index + 7,
        content: "Choose the best response.",
        explanation: "The correct response answers the question naturally.",
        options: simpleOptions(0, [item[1], item[2], item[3]], labels3),
      },
    ],
  }));
}

function buildPart3(): GroupInput[] {
  const topics = [
    ["office printer", "The printer near reception is out of toner. I ordered cartridges, but they arrive tomorrow.", "What problem do the speakers discuss?", "The printer has no toner.", "What will arrive tomorrow?", "New cartridges.", "Where is the printer?", "Near reception."],
    ["restaurant reservation", "The party of twelve moved dinner to seven thirty. Please set one long table by the window.", "What changed?", "The dinner time.", "How many people are in the party?", "Twelve.", "Where should the table be placed?", "By the window."],
    ["hotel checkout", "Your room is prepaid, but the minibar charge remains. I can email the final receipt.", "What charge remains?", "A minibar charge.", "What can the employee send?", "The final receipt.", "What kind of business is this?", "A hotel."],
    ["software update", "The update fixed the calendar error. Please restart the app before the client demo.", "What did the update fix?", "A calendar error.", "What should be restarted?", "The app.", "Why is this needed?", "For a client demo."],
    ["delivery address", "The courier needs the loading dock address, not the visitor entrance. Send it before noon.", "Who needs information?", "The courier.", "Which address is needed?", "The loading dock address.", "When should it be sent?", "Before noon."],
    ["conference badge", "I printed your badge, but the job title is wrong. Stop by registration for a corrected one.", "What is wrong?", "The job title.", "Where should the listener go?", "Registration.", "What will be corrected?", "A badge."],
    ["training room", "The training moved from room 210 to 315 because the projector in 210 stopped working.", "Why did the room change?", "The projector stopped working.", "What is the new room?", "Room 315.", "What event is mentioned?", "A training session."],
    ["warehouse order", "We received only twenty of the fifty lamps. The supplier will ship the rest next Monday.", "How many lamps arrived?", "Twenty.", "Who will ship the rest?", "The supplier.", "When will the rest ship?", "Next Monday."],
    ["bank appointment", "Mr. Lee wants to discuss a small business loan. Please prepare the forms before his two o'clock appointment.", "What does Mr. Lee want to discuss?", "A small business loan.", "What should be prepared?", "Forms.", "When is the appointment?", "At two o'clock."],
    ["marketing survey", "The survey results show customers like faster checkout. We should highlight that in the campaign.", "What do customers like?", "Faster checkout.", "Where should this be highlighted?", "In the campaign.", "What kind of results are mentioned?", "Survey results."],
    ["repair service", "The technician replaced the broken sensor. Test the machine once more before production starts.", "What was replaced?", "A broken sensor.", "What should be tested?", "The machine.", "When should it be tested?", "Before production starts."],
    ["flight schedule", "Our flight is delayed by forty minutes. We can still reach the supplier meeting on time.", "How long is the delay?", "Forty minutes.", "What meeting is mentioned?", "A supplier meeting.", "What does the speaker think?", "They can still arrive on time."],
    ["new employee", "Please add Nina to the sales mailing list. She starts Monday and needs the weekly report.", "Who starts Monday?", "Nina.", "What list should she join?", "The sales mailing list.", "What does she need?", "The weekly report."],
  ];

  let questionNumber = 32;
  return topics.map((topic) => {
    const [name, audio, q1, a1, q2, a2, q3, a3] = topic;
    const questions = [
      question(questionNumber++, q1, a1, [a1, "A parking permit.", "A product catalog.", "A hiring policy."]),
      question(questionNumber++, q2, a2, [a2, "A discount coupon.", "A visitor pass.", "A sales chart."]),
      question(questionNumber++, q3, a3, [a3, "In the storage room.", "At a public park.", "On a factory roof."]),
    ];
    return {
      audioText: audio,
      explanation: `Conversation topic: ${name}.`,
      questions,
    };
  });
}

function buildPart4(): GroupInput[] {
  const talks = [
    ["Good morning. The east entrance will be closed today while crews repair the sidewalk. Please use the lobby doors.", "What is closed?", "The east entrance.", "Why is it closed?", "For sidewalk repairs.", "What should listeners use?", "The lobby doors."],
    ["Attention passengers. Train 406 to Riverside is now boarding at platform three. Please have your tickets ready.", "What is boarding?", "Train 406.", "Where should passengers go?", "Platform three.", "What should passengers have ready?", "Their tickets."],
    ["This is a reminder that quarterly reports are due Friday. Upload your files to the shared finance folder.", "What is due Friday?", "Quarterly reports.", "Where should files be uploaded?", "The shared finance folder.", "Who is likely speaking?", "A company employee."],
    ["Welcome to the product demonstration. After the presentation, our team will answer questions near the display tables.", "What event is beginning?", "A product demonstration.", "What will happen after the presentation?", "Questions will be answered.", "Where will the team be?", "Near the display tables."],
    ["The museum shop opens at ten. Members receive a fifteen percent discount on guidebooks this week.", "When does the shop open?", "At ten.", "Who receives a discount?", "Members.", "What item is discounted?", "Guidebooks."],
    ["Your prescription is ready for pickup. The pharmacy closes at eight, but the drive-through window remains open until nine.", "What is ready?", "A prescription.", "When does the pharmacy close?", "At eight.", "What stays open until nine?", "The drive-through window."],
    ["Due to expected rain, the company picnic will move inside to cafeteria B. Lunch will still begin at noon.", "Why is the picnic moving?", "Because rain is expected.", "Where will it be held?", "Cafeteria B.", "When will lunch begin?", "At noon."],
    ["The maintenance team will inspect elevators on floors five through eight tomorrow morning. Please allow extra time.", "What will be inspected?", "Elevators.", "Which floors are affected?", "Floors five through eight.", "When will this happen?", "Tomorrow morning."],
    ["Thank you for calling Green Office Supply. Our store hours have changed. We now close at six on weekdays.", "What company is mentioned?", "Green Office Supply.", "What has changed?", "Store hours.", "When does it close on weekdays?", "At six."],
    ["This week's workshop covers customer email writing. Bring a laptop and one message you want to improve.", "What is the workshop about?", "Customer email writing.", "What should participants bring?", "A laptop.", "What kind of message is needed?", "One they want to improve."],
  ];

  let questionNumber = 71;
  return talks.map((talk) => ({
    audioText: talk[0],
    explanation: "Short talk with business or public announcement context.",
    questions: [
      question(questionNumber++, talk[1], talk[2], [talk[2], "A staff cafeteria.", "A shipping label.", "A tax invoice."]),
      question(questionNumber++, talk[3], talk[4], [talk[4], "To meet a director.", "By checking a website.", "For an annual fee."]),
      question(questionNumber++, talk[5], talk[6], [talk[6], "On a receipt.", "Near the parking lot.", "With a new password."]),
    ],
  }));
}

function question(number: number, content: string, correct: string, values: string[]) {
  return {
    number,
    content,
    explanation: `The answer is "${correct}" based on the audio or passage.`,
    options: simpleOptions(0, values),
  };
}

function buildPart5(): GroupInput[] {
  const rows: ClozeRow[] = [
    ["The manager asked the team to submit the report _____ Friday.", "by", "Correct preposition for a deadline.", ["by", "among", "during", "along"]],
    ["All visitors must wear a badge _____ they are inside the building.", "while", "While introduces a time period.", ["while", "despite", "unless", "whether"]],
    ["The new printer is more _____ than the old model.", "reliable", "An adjective is needed after more.", ["reliable", "reliably", "reliance", "rely"]],
    ["Please contact the help desk if you have _____ questions.", "any", "Any is used in conditional sentences.", ["any", "much", "every", "each"]],
    ["The sales team _____ its target for the third month in a row.", "exceeded", "Past tense fits the completed action.", ["exceeded", "exceeding", "exceed", "to exceed"]],
    ["A copy of the contract is attached for your _____.", "review", "Review is the correct noun.", ["review", "reviewed", "reviewing", "reviewer"]],
    ["The hotel offers free parking to guests who book _____.", "online", "Online describes how guests book.", ["online", "hardly", "early", "nearby"]],
    ["Because the schedule changed, the notices were sent _____.", "again", "Again means one more time.", ["again", "nearly", "always", "ahead"]],
    ["The workshop is open to employees from _____ department.", "every", "Every works with singular department.", ["every", "many", "few", "several"]],
    ["Ms. Grant will _____ the new accounting software next week.", "demonstrate", "Will is followed by base verb.", ["demonstrate", "demonstrates", "demonstrated", "demonstrating"]],
    ["The package was delivered to the wrong office _____.", "by mistake", "By mistake means accidentally.", ["by mistake", "in advance", "on purpose", "at once"]],
    ["The board approved the proposal after a _____ discussion.", "lengthy", "Lengthy is an adjective.", ["lengthy", "length", "lengthen", "lengthwise"]],
    ["Employees are encouraged to keep personal items in _____ lockers.", "their", "Their refers to employees.", ["their", "them", "they", "theirs"]],
    ["The restaurant is known for _____ service and reasonable prices.", "excellent", "Excellent modifies service.", ["excellent", "excellence", "excellently", "excel"]],
    ["If the invoice is incorrect, please notify us _____.", "immediately", "Immediately describes notify.", ["immediately", "immediate", "immediacy", "more immediate"]],
    ["The customer service desk is located _____ the main entrance.", "beside", "Beside means next to.", ["beside", "during", "about", "through"]],
    ["The committee will announce _____ decision tomorrow.", "its", "Its refers to committee.", ["its", "it", "itself", "their"]],
    ["Several applicants were invited _____ a second interview.", "for", "Invited for an interview is idiomatic.", ["for", "with", "on", "from"]],
    ["The office kitchen _____ cleaned every evening.", "is", "Passive present uses is cleaned.", ["is", "has", "does", "was being"]],
    ["We expect the renovation to be completed _____ two weeks.", "within", "Within means before the end of a period.", ["within", "onto", "among", "besides"]],
    ["The company provides training to help staff work more _____.", "efficiently", "Adverb modifies work.", ["efficiently", "efficient", "efficiency", "efficienter"]],
    ["Please read the instructions _____ installing the software.", "before", "Before introduces sequence.", ["before", "except", "because", "although"]],
    ["The supplier sent a _____ list of available items.", "complete", "Complete modifies list.", ["complete", "completely", "completion", "completedly"]],
    ["The meeting room can _____ up to thirty people.", "accommodate", "Can is followed by base verb.", ["accommodate", "accommodates", "accommodating", "accommodation"]],
    ["Our website has been updated to make navigation _____.", "easier", "Comparative adjective fits the meaning.", ["easier", "easily", "easiest", "ease"]],
    ["The director thanked everyone for _____ hard work.", "their", "Their refers to everyone in context.", ["their", "there", "they're", "them"]],
    ["The shipment will be delayed _____ the warehouse is closed.", "because", "Because gives a reason.", ["because", "although", "unless", "while"]],
    ["Only authorized personnel may enter this area without _____.", "permission", "Permission is the correct noun.", ["permission", "permitting", "permitted", "permissive"]],
    ["The brochure explains the product features in _____ detail.", "greater", "Greater detail is a common phrase.", ["greater", "greatly", "greatness", "greatest"]],
    ["Please make sure all windows are locked _____ leaving.", "before", "Before leaving is correct.", ["before", "within", "among", "during"]],
  ];

  return rows.map((row, index) => ({
    questions: [
      {
        number: 101 + index,
        content: row[0],
        explanation: row[2],
        options: simpleOptions(0, row[3] as string[]),
      },
    ],
  }));
}

function buildPart6(): GroupInput[] {
  const passages: Array<{
    title: string;
    lines: string[];
    questions: PassageQuestionRow[];
  }> = [
    {
      title: "Email: Office Supplies",
      lines: [
        "Dear Team, our supply order will arrive on Wednesday afternoon.",
        "Please check the list near the reception desk and mark any missing items.",
        "We will place an additional order next week if necessary.",
      ],
      questions: [
        ["The order will arrive _____ Wednesday afternoon.", "on", ["on", "at", "by", "of"]],
        ["Employees should check the list near the _____ desk.", "reception", ["reception", "receiving", "received", "receiver"]],
        ["What might happen next week?", "Another order may be placed.", ["Another order may be placed.", "The office will close.", "A meeting will be canceled.", "A supplier will be hired."]],
        ["The notice is mainly about _____.", "office supplies", ["office supplies", "travel plans", "software training", "restaurant service"]],
      ],
    },
    {
      title: "Notice: Building Maintenance",
      lines: [
        "Maintenance work will take place in the lobby this Friday.",
        "Visitors should use the side entrance between 8 A.M. and noon.",
        "Security staff will post signs to direct everyone safely.",
      ],
      questions: [
        ["Where will maintenance take place?", "In the lobby.", ["In the lobby.", "On the roof.", "In the cafeteria.", "At the warehouse."]],
        ["Visitors should use the _____ entrance.", "side", ["side", "sides", "sided", "beside"]],
        ["When does the temporary instruction apply?", "Between 8 A.M. and noon.", ["Between 8 A.M. and noon.", "After six P.M.", "All weekend.", "Next month."]],
        ["Who will post signs?", "Security staff.", ["Security staff.", "New customers.", "Delivery drivers.", "Accountants."]],
      ],
    },
    {
      title: "Memo: Training Registration",
      lines: [
        "Registration for the presentation skills workshop is now open.",
        "The session is limited to twenty participants and includes lunch.",
        "Please submit the online form by Monday to reserve a seat.",
      ],
      questions: [
        ["What is the workshop about?", "Presentation skills.", ["Presentation skills.", "Computer repair.", "Product shipping.", "Budget planning."]],
        ["The session is _____ to twenty participants.", "limited", ["limited", "limiting", "limit", "limits"]],
        ["What is included?", "Lunch.", ["Lunch.", "Parking.", "A hotel room.", "Office furniture."]],
        ["How should employees register?", "By submitting an online form.", ["By submitting an online form.", "By calling a supplier.", "By visiting a store.", "By mailing a check."]],
      ],
    },
    {
      title: "Advertisement: City Fitness Center",
      lines: [
        "City Fitness Center is offering discounted memberships this month.",
        "New members receive a free fitness assessment and two group classes.",
        "Visit our front desk before June 30 to learn more.",
      ],
      questions: [
        ["What is being discounted?", "Memberships.", ["Memberships.", "Parking tickets.", "Office desks.", "Concert seats."]],
        ["New members receive two group _____.", "classes", ["classes", "class", "classified", "classification"]],
        ["Where should people go for more information?", "The front desk.", ["The front desk.", "The city hall.", "The shipping dock.", "The finance office."]],
        ["When should people visit?", "Before June 30.", ["Before June 30.", "Every Friday morning.", "After the assessment.", "During winter only."]],
      ],
    },
  ];

  let questionNumber = 131;
  return passages.map((passage) => ({
    passageTitle: passage.title,
    passageLines: passage.lines,
    explanation: passage.title,
    questions: passage.questions.map((item) => ({
      number: questionNumber++,
      content: item[0],
      explanation: `The correct answer is "${item[1]}".`,
      options: simpleOptions(0, item[2] as string[]),
    })),
  }));
}

function buildPart7(): GroupInput[] {
  const configs = [2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5];
  let questionNumber = 147;

  return configs.map((count, groupIndex) => {
    const title = `Reading Set ${groupIndex + 1}: ${readingTopic(groupIndex)}`;
    const lines = readingLines(groupIndex);
    const questions = Array.from({ length: count }, (_, index) => {
      const number = questionNumber++;
      const correct = part7CorrectAnswer(groupIndex, index);
      return {
        number,
        content: part7Question(groupIndex, index),
        explanation: `The passage supports "${correct}".`,
        options: simpleOptions(0, [
          correct,
          "A temporary parking permit.",
          "A change in the tax code.",
          "A request for personal banking details.",
        ]),
      };
    });

    return {
      passageTitle: title,
      passageLines: lines,
      explanation: title,
      questions,
    };
  });
}

function readingTopic(index: number) {
  const topics = [
    "Conference Schedule",
    "Customer Email",
    "Shipping Notice",
    "Office Announcement",
    "Job Advertisement",
    "Restaurant Review",
    "Product Manual",
    "Travel Itinerary",
    "Invoice Message",
    "Library Notice",
    "Supplier Letter",
    "Training Flyer",
    "Hotel Policy",
    "Business Article",
  ];
  return topics[index];
}

function readingLines(index: number) {
  const topics = readingTopic(index);
  return [
    `${topics}: Please read the following information carefully before responding.`,
    "The main office will provide updated details by email before the end of the week.",
    "Participants should confirm their availability and contact the coordinator with questions.",
    "A small discount or priority service may be available for early responses.",
    "The notice is intended for customers, employees, or partners who need practical information.",
  ];
}

function part7Question(groupIndex: number, questionIndex: number) {
  const templates = [
    "What is the main purpose of the passage?",
    "What are readers asked to do?",
    "When will more information be provided?",
    "Who should readers contact?",
    "What is mentioned as a possible benefit?",
  ];
  return templates[questionIndex % templates.length];
}

function part7CorrectAnswer(groupIndex: number, questionIndex: number) {
  const answers = [
    "To provide practical information.",
    "Confirm their availability.",
    "Before the end of the week.",
    "The coordinator.",
    "Priority service for early responses.",
  ];
  return answers[questionIndex % answers.length];
}

function groupsByPart() {
  return {
    1: buildPart1(),
    2: buildPart2(),
    3: buildPart3(),
    4: buildPart4(),
    5: buildPart5(),
    6: buildPart6(),
    7: buildPart7(),
  };
}

async function saveQuestion(
  manager: EntityManager,
  questionGroupId: number,
  input: QuestionInput
) {
  const question = manager.create(ToeicQuestion, {
    questionGroupId,
    questionNumber: input.number,
    content: input.content,
    explanation: input.explanation,
  });

  const savedQuestion = await manager.save(question);
  const savedOptions = await manager.save(
    input.options.map((option) =>
      manager.create(ToeicQuestionOption, {
        questionId: savedQuestion.id,
        optionLabel: option.label,
        content: option.content,
        isCorrect: option.isCorrect === true,
      })
    )
  );

  const correctOption = savedOptions.find((option) => option.isCorrect);
  if (!correctOption) {
    throw new Error(`Question ${input.number} has no correct option`);
  }

  savedQuestion.correctOptionId = correctOption.id;
  await manager.save(savedQuestion);
}

async function seed() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  await AppDataSource.transaction(async (manager) => {
    const existingCollections = await manager.find(ToeicCollection, {
      where: { title: COLLECTION_TITLE },
    });

    for (const collection of existingCollections) {
      await manager.delete(ToeicCollection, collection.id);
    }

    const collection = await manager.save(
      manager.create(ToeicCollection, {
        title: COLLECTION_TITLE,
        isPublished: true,
      })
    );

    const examSet = await manager.save(
      manager.create(ToeicExamSet, {
        collectionId: collection.id,
        title: EXAM_SET_TITLE,
        isPublished: true,
      })
    );

    const allGroups = groupsByPart();

    for (const partNumber of [1, 2, 3, 4, 5, 6, 7] as const) {
      const rule = PART_RULES[partNumber];
      const part = await manager.save(
        manager.create(ToeicExamPart, {
          examSetId: examSet.id,
          partNumber,
          questionCount: rule.questionCount,
          durationSeconds: rule.durationSeconds,
        })
      );

      const groups = allGroups[partNumber];

      for (let index = 0; index < groups.length; index += 1) {
        const input = groups[index];
        const group = await manager.save(
          manager.create(ToeicQuestionGroup, {
            examPartId: part.id,
            groupOrder: index + 1,
            audioUrl: input.audioText ? ttsUrl(input.audioText) : null,
            audioDurationSeconds: input.audioText ? 12 : null,
            explanation: input.explanation ?? null,
          })
        );

        const imageUrl = input.imageUrl
          ?? (input.passageTitle && input.passageLines
            ? passageImage(input.passageTitle, input.passageLines)
            : null);

        if (imageUrl) {
          await manager.save(
            manager.create(ToeicQuestionGroupImage, {
              questionGroupId: group.id,
              imageOrder: 1,
              imageUrl,
              translationVi: null,
            })
          );
        }

        for (const item of input.questions) {
          await saveQuestion(manager, group.id, item);
        }
      }
    }
  });

  console.log(`Seeded collection: ${COLLECTION_TITLE}`);
}

seed()
  .then(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
    process.exit(1);
  });
