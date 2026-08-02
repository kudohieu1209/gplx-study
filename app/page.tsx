"use client";

import {
  ArrowRight,
  Bookmark,
  BookOpen,
  CarFront,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  GraduationCap,
  HeartHandshake,
  Home,
  Lightbulb,
  ListChecks,
  Moon,
  Play,
  RotateCcw,
  Route,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  TrafficCone,
  Trophy,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import criticalExplanationsData from "./data/critical-explanations.json";
import criticalQuestionsData from "./data/critical-questions.json";
import questionExplanationsData from "./data/question-explanations.json";
import questionsData from "./data/questions.json";

type Question = {
  id: number;
  chapter: number;
  chapterTitle: string;
  question: string;
  options: string[];
  correctAnswer: number;
  images: string[];
  sourcePage: number;
};

type QuestionProgress = {
  attempts: number;
  correct: number;
  streak: number;
  mastered: boolean;
  lastSeen: number;
  nextReview: number;
  lastAnswer?: number;
};

type SessionMode = "learn" | "review" | "quick" | "test" | "single" | "critical";

type ChapterMeta = {
  id: number;
  roman: string;
  title: string;
  shortTitle: string;
  count: number;
  icon: LucideIcon;
  color: string;
  tint: string;
};

type QuestionExplanation = {
  reason: string;
  takeaway: string;
};

const questions = questionsData as Question[];
const criticalQuestions = criticalQuestionsData as Question[];
const criticalQuestionExplanations = criticalExplanationsData as Record<number, QuestionExplanation>;
const additionalQuestionExplanations = questionExplanationsData as Record<number, QuestionExplanation>;
const PROGRESS_KEY = "lai-vung-progress-v1";
const BOOKMARK_KEY = "lai-vung-bookmarks-v1";
const DAYS_KEY = "lai-vung-study-days-v1";
const THEME_KEY = "lai-vung-theme-v1";

const chapterMeta: ChapterMeta[] = [
  {
    id: 1,
    roman: "I",
    title: "Quy định chung và quy tắc giao thông đường bộ",
    shortTitle: "Quy tắc giao thông",
    count: 180,
    icon: BookOpen,
    color: "#0a6cff",
    tint: "#eaf3ff",
  },
  {
    id: 2,
    roman: "II",
    title: "Văn hóa giao thông, đạo đức người lái xe",
    shortTitle: "Văn hóa & đạo đức",
    count: 25,
    icon: HeartHandshake,
    color: "#7c5cff",
    tint: "#f0edff",
  },
  {
    id: 3,
    roman: "III",
    title: "Kỹ thuật lái xe",
    shortTitle: "Kỹ thuật lái xe",
    count: 58,
    icon: CarFront,
    color: "#009a73",
    tint: "#e5f7f1",
  },
  {
    id: 4,
    roman: "IV",
    title: "Cấu tạo và sửa chữa",
    shortTitle: "Cấu tạo & sửa chữa",
    count: 37,
    icon: Wrench,
    color: "#e57a00",
    tint: "#fff2df",
  },
  {
    id: 5,
    roman: "V",
    title: "Báo hiệu đường bộ",
    shortTitle: "Báo hiệu đường bộ",
    count: 185,
    icon: TrafficCone,
    color: "#e44355",
    tint: "#ffebee",
  },
  {
    id: 6,
    roman: "VI",
    title: "Giải thế sa hình và kỹ năng xử lý tình huống giao thông",
    shortTitle: "Sa hình & tình huống",
    count: 115,
    icon: Route,
    color: "#1778b9",
    tint: "#e7f4fb",
  },
];

const questionExplanations: Record<number, QuestionExplanation> = {
  1: {
    reason: "Phần đường xe chạy là bộ phận trực tiếp dành cho các phương tiện lưu thông. Lề đường vẫn thuộc đường bộ nhưng chủ yếu phục vụ bảo vệ kết cấu đường và xử lý tình huống cần thiết, không phải phần xe chạy bình thường.",
    takeaway: "Phương tiện đi lại trên phần đường xe chạy.",
  },
  2: {
    reason: "Một làn đường phải đồng thời nằm trong phần đường xe chạy, được chia theo chiều dọc và có đủ chiều rộng để xe chạy an toàn. Phương án A thiếu điều kiện về chiều rộng; phương án C nhầm làn đường với nơi dừng, đỗ.",
    takeaway: "Làn đường = dải dọc đủ rộng cho xe chạy an toàn.",
  },
  3: {
    reason: "Khổ giới hạn là khoảng không gian an toàn bao quanh đường, nên phải quy định cả chiều rộng lẫn chiều cao và tính cả phần hàng hóa trên xe. Phương án B chỉ nói chiều rộng, còn C chỉ nói chiều cao nên đều chưa đầy đủ.",
    takeaway: "Khổ giới hạn luôn xét đủ hai chiều: rộng và cao.",
  },
  4: {
    reason: "Dải phân cách có thể tách hai chiều xe chạy hoặc tách phần đường của các nhóm phương tiện khác nhau trên cùng một chiều. Nó không chỉ dùng trên đường cao tốc và cũng không có chức năng phân tách hành lang an toàn giao thông.",
    takeaway: "Dải phân cách dùng để tách chiều xe chạy hoặc tách nhóm phương tiện.",
  },
  5: {
    reason: "Vạch kẻ đường là một loại báo hiệu trực tiếp trên mặt đường, dùng để phân chia làn và chỉ vị trí, hướng đi hoặc vị trí dừng. Các mô tả về cảnh báo nguy hiểm hay cung cấp thông tin chung thuộc phạm vi của những loại báo hiệu khác.",
    takeaway: "Nhớ các từ khóa: chia làn – chỉ vị trí – chỉ hướng – vị trí dừng.",
  },
  6: {
    reason: "Người điều khiển phương tiện là người trực tiếp vận hành xe cơ giới, xe thô sơ hoặc xe máy chuyên dùng. Người hướng dẫn giao thông điều tiết dòng xe nhưng không phải là người điều khiển phương tiện.",
    takeaway: "Điều khiển phương tiện khác với điều khiển, hướng dẫn giao thông.",
  },
  7: {
    reason: "Theo cách dùng trong quy định giao thông, “người lái xe” là người điều khiển xe cơ giới. Người điều khiển xe thô sơ hoặc xe máy chuyên dùng thuộc các nhóm chủ thể khác.",
    takeaway: "Người lái xe gắn với xe cơ giới.",
  },
  8: {
    reason: "Nhóm xe cơ giới gồm ô tô, các loại rơ moóc được kéo bởi ô tô, xe bốn bánh có gắn động cơ, mô tô, xe gắn máy và xe tương tự. Phương án A trộn thêm xe đạp và xe máy chuyên dùng nên không còn là một nhóm thuần xe cơ giới.",
    takeaway: "Loại phương án trộn xe đạp hoặc xe máy chuyên dùng vào nhóm xe cơ giới.",
  },
  9: {
    reason: "Xe thô sơ gồm xe đạp, xe đạp máy, xe đạp điện, xích lô, xe lăn, xe do vật nuôi kéo và các xe tương tự. Xe gắn máy, ô tô, máy kéo và rơ moóc là những phương tiện thuộc nhóm khác.",
    takeaway: "Xe thô sơ không bao gồm xe gắn máy, ô tô hay máy kéo.",
  },
  10: {
    reason: "Phương tiện giao thông đường bộ là khái niệm bao quát cả phương tiện cơ giới, phương tiện thô sơ, xe máy chuyên dùng và các loại xe tương tự. Vì hai ý đều là các nhóm cấu thành nên phải chọn “Cả hai ý trên”.",
    takeaway: "Phương tiện đường bộ bao gồm cả cơ giới và thô sơ/chuyên dùng.",
  },
  11: {
    reason: "Người tham gia giao thông không chỉ là người điều khiển hoặc người ngồi trên xe, mà còn gồm người dẫn dắt vật nuôi và người đi bộ. Hai nhóm nêu trong A và B đều thuộc phạm vi này.",
    takeaway: "Người đi bộ và người dẫn dắt vật nuôi cũng là người tham gia giao thông.",
  },
  12: {
    reason: "Khái niệm này bao gồm người điều khiển xe cơ giới, xe thô sơ và xe máy chuyên dùng. A và B chỉ chia các đối tượng thành hai phần, vì vậy đáp án đầy đủ phải gộp cả hai.",
    takeaway: "Người điều khiển phương tiện gồm đủ ba nhóm phương tiện.",
  },
  13: {
    reason: "Người điều khiển giao thông là chủ thể có nhiệm vụ tổ chức, hướng dẫn dòng giao thông: Cảnh sát giao thông hoặc người được giao nhiệm vụ. Đừng nhầm với người đang điều khiển phương tiện hay mọi người tham gia giao thông.",
    takeaway: "Điều khiển giao thông = CSGT hoặc người được giao nhiệm vụ hướng dẫn.",
  },
  14: {
    reason: "Dừng xe chỉ là đứng yên tạm thời trong khoảng thời gian cần thiết. Người lái về nguyên tắc không tắt máy, không rời vị trí lái; nếu phải rời để đóng mở cửa, xếp dỡ hoặc kiểm tra xe thì phải dùng phanh đỗ hay biện pháp an toàn khác.",
    takeaway: "Dừng xe là tạm thời; đỗ xe mới là không giới hạn thời gian.",
  },
  15: {
    reason: "Đỗ xe là trạng thái đứng yên không giới hạn thời gian. Trước khi rời xe phải dùng phanh đỗ hoặc biện pháp an toàn khác; trên đường dốc còn phải đánh lái về phía lề và chèn bánh.",
    takeaway: "Đỗ xe: không giới hạn thời gian và phải bảo đảm xe không tự dịch chuyển.",
  },
  181: {
    reason: "Đạo đức nghề nghiệp tốt tạo niềm tin với khách hàng, đồng nghiệp và doanh nghiệp; từ đó giữ chân khách hàng, xây dựng thương hiệu và nâng hiệu quả kinh doanh. Đây là kết quả thực tế của chất lượng phục vụ, không liên quan đến việc được cộng điểm giấy phép lái xe.",
    takeaway: "Đạo đức nghề nghiệp tạo uy tín và hiệu quả kinh doanh, không tạo điểm GPLX.",
  },
  182: {
    reason: "Văn hóa giao thông bắt đầu từ việc tuân thủ pháp luật, đồng thời thể hiện qua thái độ nhường nhịn và hỗ trợ người khác. Vượt đèn đỏ, giành đường hoặc lạm dụng còi đều gây nguy hiểm và làm xấu môi trường giao thông.",
    takeaway: "Đúng luật + tôn trọng + giúp đỡ người khác.",
  },
  183: {
    reason: "Đạo đức của người lái xe kinh doanh gồm cả trách nhiệm với phương tiện và việc tự rèn luyện, lẫn trách nhiệm pháp lý, khách hàng, doanh nghiệp và đồng nghiệp. Hai nhóm công việc bổ sung cho nhau nên không thể chỉ chọn một ý.",
    takeaway: "Rèn nghề phải đi cùng rèn người và chấp hành pháp luật.",
  },
  184: {
    reason: "Người vận chuyển hành khách vừa phải phục vụ lịch sự, ưu tiên người cần hỗ trợ, vừa phải giữ lối sống và tác phong nghề nghiệp lành mạnh, tôn trọng cộng đồng và môi trường. Cả hai nhóm phẩm chất đều bắt buộc.",
    takeaway: "Tôn trọng hành khách và giữ chuẩn mực của người lái xe chuyên nghiệp.",
  },
  185: {
    reason: "Văn hóa giao thông không chỉ là biết và chấp hành luật; nó còn bao gồm trách nhiệm cộng đồng, sự tôn trọng, nhường nhịn và giúp đỡ giữa những người tham gia giao thông. Hai ý là hai mặt pháp lý và ứng xử của cùng một khái niệm.",
    takeaway: "Văn hóa giao thông = đúng luật + ứng xử có trách nhiệm.",
  },
  186: {
    reason: "Đi chậm giúp bánh xe đẩy nước nhẹ hơn, hạn chế bắn nước vào người đi mô tô bên cạnh. Chạy nhanh sẽ làm nước văng mạnh; chuyển sang làn mô tô để tránh vũng nước lại gây nguy hiểm và sai phần đường.",
    takeaway: "Qua vũng nước có người bên cạnh: giảm tốc, giữ đúng làn.",
  },
  187: {
    reason: "Đi sai làn, phóng nhanh, vượt ẩu, vượt đèn đỏ và đi vào đường cấm đều là các hành vi bị quy tắc giao thông ngăn cấm. Vì vậy chúng vừa thể hiện ý thức, văn hóa giao thông kém, vừa là vi phạm pháp luật; phương án B chỉ nêu vế văn hóa nên chưa đủ.",
    takeaway: "Các hành vi nguy hiểm này vừa thiếu văn hóa, vừa vi phạm pháp luật.",
  },
  188: {
    reason: "Máu đỏ tươi phun thành tia theo nhịp mạch là dấu hiệu chảy máu động mạch. Cần chặn động mạch ở phía trên vết thương theo hướng về tim để giảm dòng máu đến vết thương; chỉ ép trực tiếp lên bề mặt có thể không kiểm soát được loại chảy máu mạnh này.",
    takeaway: "Máu phun theo nhịp mạch → nghĩ đến động mạch → chặn phía trên vết thương.",
  },
  189: {
    reason: "Một người lái xe có văn hóa phải đáp ứng đồng thời ba lớp: hiểu và chấp hành luật, có trách nhiệm với cộng đồng, và cư xử tôn trọng, nhường nhịn, giúp đỡ. Đi quá tốc độ hoặc sai làn trái trực tiếp với các yêu cầu đó.",
    takeaway: "Hiểu luật – có trách nhiệm – ứng xử tôn trọng.",
  },
  190: {
    reason: "Người lái xe phải tuân thủ hệ thống điều khiển giao thông gồm hiệu lệnh, tốc độ, đèn, biển và vạch; đồng thời phải bảo vệ người tham gia giao thông dễ bị tổn thương. Không được tự chọn làn ít xe hay chỉ đội mũ ở nơi có biển bắt buộc.",
    takeaway: "Tuân thủ báo hiệu và chủ động nhường người yếu thế.",
  },
  191: {
    reason: "Xe mô tô phải đi bên phải, đúng phần đường và làn đường; người ngồi trên xe phải đội mũ đạt chuẩn và cài quai đúng cách. Làn ít xe không phải căn cứ để tự chọn làn, còn quy định đội mũ không chỉ áp dụng ở nơi có biển báo.",
    takeaway: "Đúng bên, đúng làn, mũ đạt chuẩn và cài quai đúng.",
  },
  192: {
    reason: "Văn hóa giao thông thể hiện ở việc đi đúng phần đường, dừng đỗ đúng nơi và tuyệt đối không lái xe sau khi uống rượu bia. Sự thuận tiện của hành khách hoặc việc chỉ uống “một ít” không làm mất đi nghĩa vụ an toàn này.",
    takeaway: "Đúng làn, đúng chỗ; đã uống rượu bia thì không lái xe.",
  },
  193: {
    reason: "Còi là tín hiệu cảnh báo, chỉ nên dùng khi cần thiết và đúng mức âm lượng. Bấm liên tục, kéo dài hoặc bấm lớn trong khu đông dân cư gây căng thẳng và ô nhiễm tiếng ồn; ngược lại, không bao giờ dùng còi cũng có thể bỏ mất cảnh báo cần thiết.",
    takeaway: "Dùng còi đúng lúc, ngắn gọn và đúng âm lượng.",
  },
  194: {
    reason: "Sau tai nạn phải thực hiện đủ chuỗi trách nhiệm: dừng xe và cứu người, bảo vệ/cảnh báo hiện trường và báo cơ quan chức năng; ở lại hiện trường trừ trường hợp luật cho phép; đồng thời cung cấp thông tin trung thực. Ba ý không thay thế nhau mà đều phải thực hiện.",
    takeaway: "Dừng – cứu – báo – ở lại – cung cấp thông tin.",
  },
  195: {
    reason: "Người có mặt không được chỉ quay phim rồi rời đi. Trách nhiệm cần thiết là hỗ trợ cứu người, báo cơ quan gần nhất, góp phần bảo vệ hiện trường và tài sản, đồng thời cung cấp thông tin khi cơ quan có thẩm quyền yêu cầu.",
    takeaway: "Ưu tiên cứu người và báo tin, sau đó bảo vệ hiện trường.",
  },
  196: {
    reason: "Hô hấp nhân tạo chỉ hiệu quả khi đường thở đã thông. Vì vậy phải đặt nạn nhân nằm ngửa, kiểm tra và khai thông đường thở trước rồi mới hỗ trợ hô hấp; phương án B bỏ qua bước nền tảng này.",
    takeaway: "Không còn hô hấp: khai thông đường thở trước, hô hấp nhân tạo sau.",
  },
  197: {
    reason: "Bỏ trốn để né trách nhiệm hoặc cố tình không cứu người khi có điều kiện đều làm hậu quả tai nạn nghiêm trọng hơn và trái nghĩa vụ của người liên quan. Đây là hành vi bị nghiêm cấm, không phụ thuộc lựa chọn chủ quan của người gây tai nạn.",
    takeaway: "Không bỏ trốn, không bỏ mặc người bị nạn.",
  },
  198: {
    reason: "Vạch qua đường là vị trí dành cho người đi bộ và người lái xe phải tạo điều kiện để họ qua an toàn. Bấm còi thúc giục, tiếp tục chạy hoặc lách qua đều có thể làm người đi bộ giật mình và tăng nguy cơ va chạm.",
    takeaway: "Gặp người trên vạch qua đường: giảm tốc và nhường đường.",
  },
  199: {
    reason: "Dừng lại, hỗ trợ nạn nhân và báo cơ quan chức năng vừa giúp giảm hậu quả vừa bảo đảm hiện trường được xử lý đúng. Rời đi, chỉ đứng nhìn hoặc chỉ giúp người quen đều là thiếu trách nhiệm.",
    takeaway: "Gặp tai nạn: dừng – hỗ trợ – báo cơ quan chức năng.",
  },
  200: {
    reason: "Khi ùn tắc, lấn làn ngược chiều hoặc đi lên vỉa hè chỉ tạo thêm xung đột và có thể khóa đường của xe đối diện, người đi bộ. Cách xử lý đúng là kiên nhẫn theo tín hiệu, giữ phần đường bên phải và nhường xe ngược chiều.",
    takeaway: "Ùn tắc càng phải đúng làn và tuân thủ điều tiết.",
  },
  201: {
    reason: "Bấm còi thúc giục, đi vỉa hè, chen vào mọi khoảng trống và lấn trái không giải quyết nguyên nhân ùn tắc mà còn tạo thêm điểm xung đột, cản người đi bộ và chiều xe đối diện. Đó là các hành vi thiếu văn hóa và làm ùn tắc nặng hơn.",
    takeaway: "Không còi thúc, không leo vỉa hè, không lấn làn khi ùn tắc.",
  },
  202: {
    reason: "Phòng cháy xe phải kiểm soát đồng thời nguồn điện/nhiệt, nhiên liệu và vật dễ cháy: không đấu thêm thiết bị sai thiết kế, bảo dưỡng và xử lý dấu hiệu bất thường; đỗ/sạc xe an toàn; không để chất dễ cháy trong xe. Thiếu một nhóm vẫn còn nguy cơ cháy.",
    takeaway: "Kiểm soát điện – nhiên liệu – vật dễ cháy – quá trình sạc.",
  },
  203: {
    reason: "Khi còn khả năng dập cháy, trước hết phải ngắt khóa điện, gọi trợ giúp và báo 114. Cách dập tiếp theo phụ thuộc nhiên liệu: khi chưa trào có thể dùng phương tiện sẵn có; khi nhiên liệu trào và cháy dữ dội phải dùng bình chữa cháy, cát hoặc vật phủ phù hợp. Vì vậy cần thực hiện cả hai ý.",
    takeaway: "Ngắt điện, gọi 114, rồi chọn chất chữa cháy theo tình trạng nhiên liệu.",
  },
  204: {
    reason: "Việc đầu tiên là kiểm soát nguồn nguy hiểm: bình tĩnh đưa xe ra sát lề, tránh người và vật dễ cháy, rồi tắt khóa điện để ngắt nguồn phát sinh cháy. Hô hoán và chữa cháy được thực hiện sau khi xe đã ở vị trí an toàn; phương án C còn mô tả sai tình trạng nhiên liệu.",
    takeaway: "Phát hiện cháy: đưa xe vào nơi an toàn và tắt khóa điện trước.",
  },
  205: {
    reason: "Sơ cứu bỏng cần thực hiện theo chuỗi: gọi 115 và bảo đảm an toàn hiện trường; tách nạn nhân khỏi nguồn gây bỏng, làm mát bằng nước sạch hoặc khăn mát phù hợp; sau đó giữ ấm, bù nước khi nạn nhân tỉnh và nhanh chóng chuyển đến cơ sở y tế. Ba ý là các bước bổ sung cho nhau.",
    takeaway: "Gọi hỗ trợ – loại bỏ nguồn bỏng – làm mát – chuyển cơ sở y tế.",
  },
};

function getQuestionExplanation(question: Question): QuestionExplanation | null {
  return questionExplanations[question.id]
    ?? additionalQuestionExplanations[question.id]
    ?? criticalQuestionExplanations[question.id]
    ?? null;
}

function shuffle<T>(items: T[]) {
  const output = [...items];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }
  return output;
}

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateStreak(days: string[]) {
  const completedDays = new Set(days);
  const cursor = new Date();
  let streak = 0;
  while (completedDays.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function modeLabel(mode: SessionMode) {
  if (mode === "test") return "Thi thử 30 câu";
  if (mode === "review") return "Ôn câu cần nhớ";
  if (mode === "quick") return "Ôn nhanh 10 câu";
  if (mode === "single") return "Tra cứu câu hỏi";
  if (mode === "critical") return "60 câu điểm liệt";
  return "Học theo chương";
}

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export default function HomePage() {
  const [progress, setProgress] = useState<Record<number, QuestionProgress>>({});
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [studyDays, setStudyDays] = useState<string[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<Question[]>([]);
  const [sessionMode, setSessionMode] = useState<SessionMode>("learn");
  const [sessionAnswers, setSessionAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryChapter, setLibraryChapter] = useState<number | null>(null);
  const [infoModal, setInfoModal] = useState<"tips" | "critical" | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [testSecondsLeft, setTestSecondsLeft] = useState(20 * 60);
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const [activeChapter, setActiveChapter] = useState<number | null>(null);
  const [chapterReplay, setChapterReplay] = useState(false);
  const [answerSheetOpen, setAnswerSheetOpen] = useState(false);

  useEffect(() => {
    try {
      const storedProgress = localStorage.getItem(PROGRESS_KEY);
      const storedBookmarks = localStorage.getItem(BOOKMARK_KEY);
      const storedDays = localStorage.getItem(DAYS_KEY);
      const storedTheme = localStorage.getItem(THEME_KEY) as "light" | "dark" | null;
      if (storedProgress) setProgress(JSON.parse(storedProgress));
      if (storedBookmarks) setBookmarks(JSON.parse(storedBookmarks));
      if (storedDays) setStudyDays(JSON.parse(storedDays));
      if (storedTheme) {
        setTheme(storedTheme);
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setTheme("dark");
      }
    } catch {
      // A corrupted local cache should never prevent the learning app from opening.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (hydrated) localStorage.setItem(THEME_KEY, theme);
  }, [theme, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }, [progress, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
  }, [bookmarks, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(DAYS_KEY, JSON.stringify(studyDays));
  }, [studyDays, hydrated]);

  const activeQuestion = session[0];
  const answeredCount = session.filter(
    (question) => sessionAnswers[question.id] !== undefined,
  ).length;
  const activeChapterQuestions = activeChapter
    ? questions.filter((question) => question.chapter === activeChapter)
    : [];
  const learnedChapterCount = activeChapterQuestions.filter(
    (question) => progress[question.id]?.attempts || sessionAnswers[question.id] !== undefined,
  ).length;
  const sessionDisplayAnswered = activeChapter && !chapterReplay
    ? learnedChapterCount
    : answeredCount;
  const sessionDisplayTotal = activeChapter
    ? activeChapterQuestions.length
    : session.length;
  const answerSheetQuestions = activeChapter ? activeChapterQuestions : session;
  const answerSheetCompleted = answerSheetQuestions.filter((question) => {
    if (sessionAnswers[question.id] !== undefined) return true;
    return Boolean(activeChapter && !chapterReplay && progress[question.id]?.attempts);
  }).length;

  const summary = useMemo(() => {
    const values = Object.entries(progress)
      .filter(([questionId]) => Number(questionId) <= questions.length)
      .map(([, item]) => item);
    const attempts = values.reduce((total, item) => total + item.attempts, 0);
    const correct = values.reduce((total, item) => total + item.correct, 0);
    const mastered = values.filter((item) => item.mastered).length;
    const needsReview = values.filter(
      (item) => item.attempts > item.correct || item.nextReview <= Date.now(),
    ).length;
    return {
      attempts,
      correct,
      mastered,
      needsReview,
      accuracy: attempts ? Math.round((correct / attempts) * 100) : 0,
      completion: Math.round((mastered / questions.length) * 100),
    };
  }, [progress]);

  const chapterProgress = useMemo(
    () =>
      chapterMeta.map((chapter) => {
        const chapterQuestions = questions.filter((item) => item.chapter === chapter.id);
        const mastered = chapterQuestions.filter((item) => progress[item.id]?.mastered).length;
        const attempted = chapterQuestions.filter((item) => progress[item.id]?.attempts).length;
        return {
          ...chapter,
          mastered,
          attempted,
          percent: Math.round((attempted / chapter.count) * 100),
        };
      }),
    [progress],
  );

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase("vi");
    const chapterQuestions = libraryChapter
      ? questions.filter((question) => question.chapter === libraryChapter)
      : questions;
    if (!term) return !libraryChapter && bookmarks.length
      ? chapterQuestions.filter((question) => bookmarks.includes(question.id)).slice(0, 20)
      : chapterQuestions.slice(0, 30);
    const exactId = Number(term.replace(/[^0-9]/g, ""));
    return chapterQuestions
      .filter(
        (question) =>
          question.id === exactId ||
          question.question.toLocaleLowerCase("vi").includes(term),
      )
      .slice(0, 30);
  }, [searchTerm, bookmarks, libraryChapter]);

  const openLibrary = useCallback((chapter: number | null = null) => {
    setLibraryChapter(chapter);
    setSearchTerm("");
    setLibraryOpen(true);
  }, []);

  const recordStudyDay = useCallback(() => {
    const today = dateKey();
    setStudyDays((current) =>
      current.includes(today) ? current : [...current, today],
    );
  }, []);

  const applyAttempt = useCallback((question: Question, answer: number) => {
    const isCorrect = answer === question.correctAnswer;
    const now = Date.now();
    setProgress((current) => {
      const previous = current[question.id] ?? {
        attempts: 0,
        correct: 0,
        streak: 0,
        mastered: false,
        lastSeen: 0,
        nextReview: 0,
      };
      const streak = isCorrect ? previous.streak + 1 : 0;
      const delay = isCorrect
        ? [0, 1, 3, 7, 14][Math.min(streak, 4)] * 24 * 60 * 60 * 1000
        : 10 * 60 * 1000;
      return {
        ...current,
        [question.id]: {
          attempts: previous.attempts + 1,
          correct: previous.correct + (isCorrect ? 1 : 0),
          streak,
          mastered: streak >= 3,
          lastSeen: now,
          nextReview: now + delay,
          lastAnswer: answer,
        },
      };
    });
  }, []);

  const startSession = useCallback(
    (mode: SessionMode, chapter?: number, singleQuestion?: Question) => {
      let selected: Question[] = [];
      const restoredAnswers: Record<number, number> = {};
      let nextActiveChapter: number | null = null;
      let nextChapterReplay = false;
      if (singleQuestion) {
        selected = [singleQuestion];
      } else if (mode === "learn" && chapter) {
        const chapterQuestions = questions
          .filter((question) => question.chapter === chapter)
          .sort((first, second) => first.id - second.id);
        nextActiveChapter = chapter;
        nextChapterReplay = chapterQuestions.every(
          (question) => progress[question.id]?.attempts,
        );
        selected = chapterQuestions;
        if (!nextChapterReplay) {
          chapterQuestions.forEach((question) => {
            const savedProgress = progress[question.id];
            const savedAnswer = savedProgress?.lastAnswer
              ?? (savedProgress?.streak ? question.correctAnswer : undefined);
            if (savedAnswer !== undefined) restoredAnswers[question.id] = savedAnswer;
          });
        }
      } else if (mode === "critical") {
        selected = [...criticalQuestions].sort((first, second) => {
          const firstProgress = progress[first.id];
          const secondProgress = progress[second.id];
          const firstPriority = firstProgress?.mastered ? 2 : firstProgress?.attempts ? 1 : 0;
          const secondPriority = secondProgress?.mastered ? 2 : secondProgress?.attempts ? 1 : 0;
          return firstPriority - secondPriority || first.id - second.id;
        });
      } else if (mode === "test") {
        selected = shuffle(questions).slice(0, 30);
      } else {
        const pool = mode === "review" ? [...questions, ...criticalQuestions] : questions;
        const prioritized = [...pool].sort((first, second) => {
          const firstProgress = progress[first.id];
          const secondProgress = progress[second.id];
          const firstPriority = firstProgress
            ? firstProgress.mastered
              ? 2
              : firstProgress.attempts > firstProgress.correct
                ? 0
                : 1
            : 0;
          const secondPriority = secondProgress
            ? secondProgress.mastered
              ? 2
              : secondProgress.attempts > secondProgress.correct
                ? 0
                : 1
            : 0;
          return firstPriority - secondPriority || first.id - second.id;
        });
        if (mode === "review") {
          const weak = prioritized.filter((question) => {
            const item = progress[question.id];
            return item && !item.mastered && item.attempts > item.correct;
          });
          selected = (weak.length ? weak : prioritized).slice(0, 15);
        } else {
          selected = prioritized.slice(0, mode === "quick" ? 10 : 15);
        }
      }
      setSession(selected);
      setSessionMode(mode);
      setActiveChapter(nextActiveChapter);
      setChapterReplay(nextChapterReplay);
      setSessionAnswers(restoredAnswers);
      setShowResults(false);
      setLibraryOpen(false);
      setAnswerSheetOpen(false);
      if (mode === "test") setTestSecondsLeft(20 * 60);
      window.scrollTo({ top: 0, behavior: "auto" });
    },
    [progress],
  );

  const chooseAnswer = useCallback(
    (question: Question, answer: number) => {
      if (sessionMode !== "test" && sessionAnswers[question.id] !== undefined) return;
      setSessionAnswers((current) => ({
        ...current,
        [question.id]: answer,
      }));
      if (sessionMode !== "test") {
        applyAttempt(question, answer);
        recordStudyDay();
      }
    },
    [applyAttempt, recordStudyDay, sessionAnswers, sessionMode],
  );

  const resetCurrentStudy = () => {
    if (!activeQuestion || sessionMode === "test") return;
    const resetQuestions = activeChapter ? activeChapterQuestions : session;
    const resetLabel = activeChapter
      ? `chương ${chapterMeta[activeChapter - 1].roman}`
      : "phiên ôn tập này";
    if (!window.confirm(`Đặt lại ${resetLabel}? Tất cả câu trong phạm vi này sẽ trở về trạng thái chưa làm.`)) return;

    setProgress((current) => {
      const next = { ...current };
      resetQuestions.forEach((question) => delete next[question.id]);
      return next;
    });
    setSession(activeChapter
      ? [...resetQuestions].sort((first, second) => first.id - second.id)
      : [...resetQuestions]);
    setSessionAnswers({});
    setChapterReplay(false);
    setAnswerSheetOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const jumpToQuestion = (questionId: number) => {
    setAnswerSheetOpen(false);
    window.requestAnimationFrame(() => {
      document.getElementById(`cau-${questionId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const finishSession = useCallback(() => {
    if (sessionMode === "test") {
      session.forEach((question) => {
        const answer = sessionAnswers[question.id];
        if (answer !== undefined) applyAttempt(question, answer);
      });
      recordStudyDay();
    }
    setShowResults(true);
  }, [applyAttempt, recordStudyDay, session, sessionAnswers, sessionMode]);

  useEffect(() => {
    if (sessionMode !== "test" || !activeQuestion || showResults) return;
    const timer = window.setInterval(() => {
      setTestSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [sessionMode, activeQuestion, showResults]);

  useEffect(() => {
    if (sessionMode === "test" && activeQuestion && !showResults && testSecondsLeft === 0) {
      finishSession();
    }
  }, [activeQuestion, finishSession, sessionMode, showResults, testSecondsLeft]);

  useEffect(() => {
    if (!activeQuestion || showResults) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSession([]);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeQuestion, showResults]);

  const toggleBookmark = (questionId: number) => {
    setBookmarks((current) =>
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId],
    );
  };

  const resultScore = session.filter(
    (question) => sessionAnswers[question.id] === question.correctAnswer,
  ).length;
  const resultPercent = session.length
    ? Math.round((resultScore / session.length) * 100)
    : 0;

  const showDashboard = () => {
    setSession([]);
    setSessionAnswers({});
    setShowResults(false);
    setActiveChapter(null);
    setChapterReplay(false);
    setAnswerSheetOpen(false);
    setChaptersOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showChapters = () => {
    setChaptersOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className={`topbar ${activeQuestion && !showResults ? "session-topbar" : ""}`}>
        <div className={`topbar-inner ${activeQuestion && !showResults ? "session-active" : ""}`}>
          <button className="brand" aria-label={activeQuestion ? "Rời phiên học và về trang tổng quan" : "Về trang tổng quan"} onClick={showDashboard}>
            <span className="brand-mark"><CarFront size={22} strokeWidth={2.2} /></span>
            <span>
              <strong>GPLX</strong>
              <small>Hạng B</small>
            </span>
          </button>

          {activeQuestion && !showResults && (
            <div className="topbar-session-status" aria-live="polite">
              <small>
                {activeChapter
                  ? `CHƯƠNG ${chapterMeta[activeChapter - 1].roman}: ${chapterMeta[activeChapter - 1].title}`
                  : modeLabel(sessionMode)}
              </small>
              <strong className={sessionMode === "test" ? "quiz-clock" : ""}>
                {sessionMode === "test" && <><Clock3 size={13} /> {formatClock(testSecondsLeft)} · </>}
                {sessionDisplayAnswered}/{sessionDisplayTotal}
              </strong>
            </div>
          )}

          <div className="topbar-actions">
            {activeQuestion && !showResults && sessionMode !== "test" && (
              <button className="icon-button" onClick={resetCurrentStudy} aria-label="Đặt lại tiến độ phiên ôn tập" title="Đặt lại tiến độ">
                <RotateCcw size={18} />
              </button>
            )}
            {activeQuestion && !showResults && (
              <button className="icon-button" onClick={() => setAnswerSheetOpen(true)} aria-label="Mở Answer sheet" title="Answer sheet">
                <ListChecks size={19} />
              </button>
            )}
            {activeQuestion && !showResults && sessionMode === "test" && (
              <button className="primary-button topbar-submit" onClick={finishSession} disabled={answeredCount !== session.length}>
                <span>Nộp bài</span><Check size={17} />
              </button>
            )}
            {(!activeQuestion || showResults) && (
              <>
                <button className="icon-button topbar-search" onClick={() => openLibrary()} aria-label="Tìm câu hỏi"><Search size={19} /></button>
                <button className="icon-button topbar-settings" onClick={() => setSettingsOpen(true)} aria-label="Cài đặt"><Settings size={19} /></button>
              </>
            )}
          </div>
        </div>
      </header>

      {(!activeQuestion || showResults) && (
      <>
      <div className="content-wrap">
        {!chaptersOpen && (
        <>
        <section className="exam-summary" aria-label="Cấu trúc đề thi hạng B">
          <div className="exam-stat"><strong>30</strong><span>Câu hỏi/đề</span></div>
          <div className="exam-stat"><strong>20&apos;</strong><span>Thời gian</span></div>
          <div className="exam-stat"><strong>27/30</strong><span>Điểm đạt</span></div>
          <div className="exam-stat"><strong>600</strong><span>Tổng câu</span></div>
        </section>

        <section className="exam-hub" aria-label="Chức năng học và thi">
          <article className="exam-primary-card">
            <div className="exam-card-orb orb-one" />
            <div className="exam-card-orb orb-two" />
            <span className="exam-primary-icon"><GraduationCap size={27} /></span>
            <div>
              <span className="exam-kicker">MÔ PHỎNG ĐỀ HẠNG B</span>
              <h1>Thi thử Online</h1>
              <p>30 câu trong 20 phút, cần đúng tối thiểu 27 câu để đạt.</p>
            </div>
            <button onClick={() => startSession("test")}>
              Bắt đầu thi <ArrowRight size={18} />
            </button>
          </article>

          <div className="feature-grid">
            <button
              className="feature-card theory-card"
              aria-controls="lo-trinh-600"
              aria-expanded={chaptersOpen}
              onClick={showChapters}
            >
              <span className="feature-icon green"><BookOpen size={23} /></span>
              <span><strong>Học lý thuyết theo chương</strong><small>Học toàn bộ câu hỏi theo 6 chủ đề</small></span>
              <ChevronRight className="feature-arrow" size={18} />
            </button>

            <button className="feature-card sign-card" onClick={() => openLibrary(5)}>
              <span className="feature-icon orange"><TrafficCone size={23} /></span>
              <span><strong>Biển báo</strong><small>Tra cứu hệ thống biển báo giao thông</small></span>
              <ChevronRight className="feature-arrow" size={18} />
            </button>

            <button className="feature-card tips-card" onClick={() => setInfoModal("tips")}>
              <span className="feature-icon yellow"><Lightbulb size={23} /></span>
              <span><strong>Mẹo ghi nhớ</strong><small>Cách học nhanh, nhớ lâu và tránh học vẹt</small></span>
              <ChevronRight className="feature-arrow" size={18} />
            </button>

            <button className="feature-card critical-card" onClick={() => setInfoModal("critical")}>
              <span className="feature-icon red"><CircleAlert size={23} /></span>
              <span><strong>Câu điểm liệt</strong><small>60 câu hỏi cần đặc biệt lưu ý</small></span>
              <ChevronRight className="feature-arrow" size={18} />
            </button>
          </div>
        </section>
        </>
        )}

        {chaptersOpen && (
        <section className="chapters-section chapters-page" id="lo-trinh-600">
          <div className="section-heading">
            <div><span>Lộ trình 600 câu</span><h2>Học theo 6 chương</h2></div>
            <button className="text-button" onClick={() => openLibrary()}>Xem tất cả <ChevronRight size={16} /></button>
          </div>

          <div className="chapter-grid">
            {chapterProgress.map((chapter) => {
              const Icon = chapter.icon;
              return (
                <article className="chapter-card" key={chapter.id}>
                  <div className="chapter-card-top">
                    <span className="chapter-icon" style={{ color: chapter.color, background: chapter.tint }}><Icon size={22} /></span>
                    <span className="chapter-number">CHƯƠNG {chapter.roman}</span>
                    {chapter.percent === 100 && <span className="done-badge"><Check size={13} /> Xong</span>}
                  </div>
                  <h3>{chapter.title}</h3>
                  <div className="chapter-meta"><span>{chapter.count} câu hỏi</span><span>{chapter.percent}%</span></div>
                  <div className="chapter-progress"><span style={{ width: `${chapter.percent}%`, background: chapter.color }} /></div>
                  <button onClick={() => startSession("learn", chapter.id)}>
                    {chapter.percent === 100 ? "Học lại chương này" : chapter.attempted ? "Học tiếp chương này" : "Bắt đầu chương này"}
                    <ChevronRight size={17} />
                  </button>
                </article>
              );
            })}
          </div>
        </section>
        )}

      </div>

      <nav className="mobile-nav" aria-label="Điều hướng di động">
        <button className={!chaptersOpen ? "active" : ""} onClick={showDashboard}><Home size={20} /><span>Tổng quan</span></button>
        <button onClick={() => startSession("review")}><RotateCcw size={20} /><span>Ôn tập</span></button>
        <button onClick={() => startSession("test")}><GraduationCap size={21} /><span>Thi thử</span></button>
        <button className={chaptersOpen ? "active" : ""} onClick={showChapters}><ListChecks size={20} /><span>6 chương</span></button>
      </nav>
      </>
      )}

      {activeQuestion && !showResults && (
        <section className="quiz-page" aria-label={modeLabel(sessionMode)}>
          <div className="quiz-page-content">
            <div className="quiz-body quiz-list-body">
              {session.map((question, questionIndex) => {
                const selectedAnswer = sessionAnswers[question.id];
                const reveal = sessionMode !== "test" && selectedAnswer !== undefined;
                const selectedIsCorrect = selectedAnswer === question.correctAnswer;
                const explanation = selectedAnswer !== undefined
                  ? getQuestionExplanation(question)
                  : null;

                return (
                  <article className="quiz-question-card" id={`cau-${question.id}`} key={`${sessionMode}-${question.id}-${questionIndex}`}>
                    <div className="quiz-question-heading">
                      <span className="question-number">{sessionMode === "critical" ? questionIndex + 1 : question.id}</span>
                      <div>
                        <h2>{question.question}</h2>
                      </div>
                      <button
                        className={`question-bookmark ${bookmarks.includes(question.id) ? "bookmarked" : ""}`}
                        onClick={() => toggleBookmark(question.id)}
                        aria-label={`Đánh dấu câu ${question.id}`}
                      >
                        <Bookmark size={17} fill={bookmarks.includes(question.id) ? "currentColor" : "none"} />
                      </button>
                    </div>

                    {question.images.length > 0 && (
                      <div className={`question-images ${question.images.length > 1 ? "multiple" : ""}`}>
                        {question.images.map((image, imageIndex) => (
                          <img src={image} alt={`Hình minh họa câu ${question.id}${imageIndex ? `, phần ${imageIndex + 1}` : ""}`} key={image} />
                        ))}
                      </div>
                    )}

                    <div className="answer-list answer-list-inline">
                      {question.options.map((option, optionIndex) => {
                        const isSelected = selectedAnswer === optionIndex;
                        const isCorrect = optionIndex === question.correctAnswer;
                        const answerClass = reveal
                          ? isCorrect
                            ? "correct"
                            : isSelected
                              ? "wrong"
                              : ""
                          : isSelected
                            ? "selected"
                            : "";
                        return (
                          <button
                            className={`answer-option ${answerClass}`}
                            key={`${question.id}-${optionIndex}`}
                            onClick={() => chooseAnswer(question, optionIndex)}
                            disabled={reveal}
                            aria-pressed={isSelected}
                          >
                            <span className="answer-letter">{String.fromCharCode(65 + optionIndex)}</span>
                            <span>{option}</span>
                            <span className="answer-state">
                              {reveal && isCorrect ? <Check size={17} /> : reveal && isSelected ? <X size={17} /> : null}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {reveal && (
                      <div className={`feedback-card explanation-card ${selectedIsCorrect ? "success" : "error"}`} aria-live="polite">
                        <span className="explanation-icon">
                          {selectedIsCorrect ? <Check size={18} /> : <CircleAlert size={18} />}
                        </span>
                        <div>
                          <strong>{selectedIsCorrect ? "Chính xác" : "Bạn chọn chưa đúng"}</strong>
                          <span className={!explanation ? "explanation-missing" : undefined}>
                            {!selectedIsCorrect && (
                              <><b>Đáp án đúng:</b> {String.fromCharCode(65 + question.correctAnswer)}. </>
                            )}
                            {explanation
                              ? <><b>Vì sao?</b> {explanation.reason}</>
                              : "Câu này chưa có lời giải chi tiết — hệ thống không hiển thị giải thích mẫu để tránh gây hiểu nhầm."}
                          </span>
                          {explanation && (
                            <small className="explanation-takeaway"><Lightbulb size={14} /><b>Ghi nhớ:</b> {explanation.takeaway}</small>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {answerSheetOpen && activeQuestion && !showResults && (
        <div className="modal-layer answer-sheet-layer" role="dialog" aria-modal="true" aria-label="Answer sheet">
          <button className="modal-backdrop" aria-label="Đóng Answer sheet" onClick={() => setAnswerSheetOpen(false)} />
          <section className="answer-sheet-panel">
            <header className="answer-sheet-header">
              <div>
                <small>ANSWER SHEET</small>
                <h2>{answerSheetCompleted}/{answerSheetQuestions.length} câu đã làm</h2>
              </div>
              <button className="icon-button quiet" onClick={() => setAnswerSheetOpen(false)} aria-label="Đóng Answer sheet"><X size={19} /></button>
            </header>

            <div className="answer-sheet-legend" aria-label="Chú thích trạng thái">
              <span><i className="unanswered" /> Chưa làm</span>
              <span><i className="completed" /> Đã làm</span>
              {sessionMode !== "test" && <><span><i className="correct" /> Đúng</span><span><i className="wrong" /> Chưa đúng</span></>}
            </div>

            <div className="answer-sheet-grid">
              {answerSheetQuestions.map((question) => {
                const currentAnswer = sessionAnswers[question.id];
                const sessionIndex = session.findIndex((item) => item.id === question.id);
                const isInCurrentSession = sessionIndex >= 0;
                const answeredEarlier = Boolean(activeChapter && !chapterReplay && progress[question.id]?.attempts);
                let status = "unanswered";
                if (currentAnswer !== undefined) {
                  status = sessionMode === "test"
                    ? "completed"
                    : currentAnswer === question.correctAnswer ? "correct" : "wrong";
                } else if (answeredEarlier) {
                  status = "completed";
                }
                const displayNumber = sessionMode === "test" || sessionMode === "critical"
                  ? sessionIndex + 1
                  : question.id;
                return (
                  <button
                    className={status}
                    key={`answer-sheet-${question.id}`}
                    onClick={() => jumpToQuestion(question.id)}
                    disabled={!isInCurrentSession}
                    title={isInCurrentSession ? `Đi tới câu ${displayNumber}` : "Câu này đã hoàn thành ở phiên trước"}
                    aria-label={`Câu ${displayNumber}: ${status === "unanswered" ? "chưa làm" : status === "correct" ? "đúng" : status === "wrong" ? "chưa đúng" : "đã làm"}`}
                  >
                    {displayNumber}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {showResults && (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Kết quả phiên học">
          <div className="modal-backdrop static" />
          <section className="result-modal">
            <div className="result-icon"><Trophy size={36} /></div>
            <span className="eyebrow centered">HOÀN THÀNH PHIÊN HỌC</span>
            <h2>
              {sessionMode === "test"
                ? resultScore >= 27 ? "Bạn đã đạt bài thi thử!" : "Chưa đạt, mình ôn lại nhé."
                : resultPercent >= 80 ? "Một phiên học rất tốt!" : "Mỗi lần ôn là một lần tiến bộ."}
            </h2>
            <p>
              Bạn trả lời đúng <strong>{resultScore}/{session.length} câu</strong>.
              {sessionMode === "test" ? " Mốc đạt của đề là 27/30 câu." : " Các câu chưa đúng đã được đưa vào lịch ôn."}
            </p>
            <div className="result-score"><strong>{resultPercent}%</strong><span>Độ chính xác</span></div>
            <div className="result-actions">
              <button className="secondary-button" onClick={showDashboard}>Về tổng quan</button>
              <button className="primary-button" onClick={() => startSession("review")}><RotateCcw size={17} /> Ôn câu sai</button>
            </div>
          </section>
        </div>
      )}

      {libraryOpen && (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Thư viện 600 câu">
          <button className="modal-backdrop" aria-label="Đóng" onClick={() => setLibraryOpen(false)} />
          <section className="library-sheet">
            <header className="sheet-header">
              <div><small>THƯ VIỆN</small><h2>{libraryChapter === 5 ? "Tra cứu biển báo" : "Tra cứu 600 câu"}</h2></div>
              <button className="icon-button quiet" onClick={() => setLibraryOpen(false)} aria-label="Đóng"><X size={20} /></button>
            </header>
            <div className="search-box"><Search size={19} /><input autoFocus value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Nhập số câu hoặc nội dung…" /></div>
            {!libraryChapter && !searchTerm && bookmarks.length > 0 && <p className="sheet-note"><Bookmark size={14} /> Đang hiển thị các câu bạn đã đánh dấu</p>}
            <div className="question-list">
              {searchResults.map((question) => (
                <button key={question.id} onClick={() => startSession("single", undefined, question)}>
                  <span className="question-list-number">{question.id}</span>
                  <span><strong>{question.question}</strong><small>Chương {chapterMeta[question.chapter - 1].roman} · {question.options.length} lựa chọn</small></span>
                  {progress[question.id]?.mastered ? <Check className="mastered-check" size={17} /> : <ChevronRight size={17} />}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {infoModal && (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-label={infoModal === "tips" ? "Mẹo ghi nhớ" : "Câu điểm liệt"}>
          <button className="modal-backdrop" aria-label="Đóng" onClick={() => setInfoModal(null)} />
          <section className="info-modal">
            <header className="sheet-header">
              <div>
                <small>{infoModal === "tips" ? "HỌC NHẸ, NHỚ LÂU" : "LƯU Ý QUAN TRỌNG"}</small>
                <h2>{infoModal === "tips" ? "Mẹo ghi nhớ" : "Câu điểm liệt"}</h2>
              </div>
              <button className="icon-button quiet" onClick={() => setInfoModal(null)} aria-label="Đóng"><X size={19} /></button>
            </header>
            {infoModal === "tips" ? (
              <div className="tips-list">
                <div><span>01</span><p><strong>Học từng chương nhỏ</strong>Đừng làm cả 600 câu một lượt. Hoàn thành từng nhóm 15 câu để giữ tập trung.</p></div>
                <div><span>02</span><p><strong>Ôn câu sai trước</strong>Câu trả lời sai sẽ được GPLX tự động đưa lên đầu phiên học sau.</p></div>
                <div><span>03</span><p><strong>Không học vị trí đáp án</strong>Hãy đọc lại câu hỏi và tự nói lý do trước khi xem đáp án đúng.</p></div>
                <div><span>04</span><p><strong>Lặp lại cách quãng</strong>Đúng liên tiếp 3 lần ở các phiên khác nhau mới được tính là thành thạo.</p></div>
              </div>
            ) : (
              <div className="critical-note">
                <span><CircleAlert size={26} /></span>
                <h3>Đã có đủ 60 câu điểm liệt</h3>
                <p>Học riêng toàn bộ câu hỏi về các tình huống mất an toàn giao thông nghiêm trọng. Mỗi câu trả lời sai sẽ được tự động đưa vào lịch ôn.</p>
                <button className="primary-button critical-start" onClick={() => { setInfoModal(null); startSession("critical"); }}>
                  <Play size={17} /> Bắt đầu luyện 60 câu
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {settingsOpen && (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Cài đặt">
          <button className="modal-backdrop" aria-label="Đóng" onClick={() => setSettingsOpen(false)} />
          <section className="settings-popover">
            <header className="sheet-header"><div><small>TÙY CHỈNH</small><h2>Cài đặt</h2></div><button className="icon-button quiet" onClick={() => setSettingsOpen(false)}><X size={19} /></button></header>
            <button className="setting-row" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
              <span className="setting-icon">{theme === "light" ? <Moon size={19} /> : <Sun size={19} />}</span>
              <span><strong>Giao diện</strong><small>{theme === "light" ? "Chuyển sang nền tối" : "Chuyển sang nền sáng"}</small></span>
              <ChevronRight size={17} />
            </button>
            <div className="setting-row informational">
              <span className="setting-icon"><ShieldCheck size={19} /></span>
              <span><strong>Tiến độ riêng tư</strong><small>Dữ liệu chỉ lưu trên thiết bị này</small></span>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
