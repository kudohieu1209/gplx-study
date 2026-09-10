import { readFile, writeFile } from "node:fs/promises";

const questionsUrl = new URL("../app/data/questions.json", import.meta.url);
const explanationsUrl = new URL("../app/data/question-explanations.json", import.meta.url);

const questions = JSON.parse(await readFile(questionsUrl, "utf8"));
const existingExplanations = JSON.parse(await readFile(explanationsUrl, "utf8"));

const inlineExplanationIds = new Set([
  ...Array.from({ length: 15 }, (_, index) => index + 1),
  ...Array.from({ length: 25 }, (_, index) => index + 181),
]);

function cleanSentence(value) {
  return value.trim().replace(/[.;:,?!]+$/u, "");
}

function lowercaseFirst(value) {
  if (!value) return value;
  return `${value[0].toLocaleLowerCase("vi-VN")}${value.slice(1)}`;
}

function uppercaseFirst(value) {
  if (!value) return value;
  return `${value[0].toLocaleUpperCase("vi-VN")}${value.slice(1)}`;
}

function joinVietnamese(items) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]}; đồng thời ${items[1]}`;
  return `${items.slice(0, -1).join("; ")}; đồng thời ${items.at(-1)}`;
}

function referencedOptionIndexes(answer, optionCount, answerIndex) {
  const normalized = answer.toLocaleLowerCase("vi-VN");
  const explicitIndexes = [...normalized.matchAll(/(?:ý|phương án)\s*([1-4])/gu)]
    .map((match) => Number(match[1]) - 1);

  if (explicitIndexes.length > 0) {
    return [...new Set(explicitIndexes)].filter((index) => index >= 0 && index < optionCount);
  }

  if (/cả\s+(?:hai|ba|bốn|2|3|4)\s+ý\s+trên/u.test(normalized)
    || /tất cả\s+(?:các\s+)?ý/u.test(normalized)) {
    return Array.from({ length: answerIndex }, (_, index) => index);
  }

  return [];
}

function answerFact(question) {
  const answer = cleanSentence(question.options[question.correctAnswer]);
  const referencedIndexes = referencedOptionIndexes(
    answer,
    question.options.length,
    question.correctAnswer,
  );

  if (referencedIndexes.length === 0) {
    return lowercaseFirst(answer).replace(/^là\s+/u, "");
  }

  return joinVietnamese(referencedIndexes.map((index) => (
    lowercaseFirst(cleanSentence(question.options[index])).replace(/^là\s+/u, "")
  )));
}

function rawAnswer(question) {
  return cleanSentence(question.options[question.correctAnswer]);
}

function shortened(value, maximumLength = 175) {
  if (value.length <= maximumLength) return value;
  const clipped = value.slice(0, maximumLength + 1);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, lastSpace > 80 ? lastSpace : maximumLength)}…`;
}

function withFinalPeriod(value) {
  return /[.!?…]$/u.test(value) ? value : `${value}.`;
}

function normalizedQuestion(question) {
  return question.question.toLocaleLowerCase("vi-VN");
}

function includesAny(value, keywords) {
  return keywords.some((keyword) => value.includes(keyword));
}

function lawInsight(question, fact) {
  const text = `${normalizedQuestion(question)} ${fact.toLocaleLowerCase("vi-VN")}`;

  if (text.includes("tín hiệu ưu tiên")) {
    return "Xe chỉ được hưởng quyền ưu tiên khi đang làm nhiệm vụ và phát tín hiệu theo quy định; có tín hiệu thì xe khác phải nhường, không có tín hiệu thì áp dụng quy tắc thông thường.";
  }
  if (text.includes("còi")) {
    return "Còi là tín hiệu phòng ngừa nguy hiểm, không phải phương tiện thúc ép xe khác hoặc gây tiếng ồn tùy ý.";
  }
  if (includesAny(text, ["vượt xe", "xin vượt", "được vượt", "không được vượt"])) {
    if (text.includes("cầu hẹp") && includesAny(text, ["đường cong", "tầm nhìn bị hạn chế"])) {
      return "Cầu hẹp một làn không có khoảng tránh, còn đường cong khuất tầm nhìn không cho phép kiểm tra xe ngược chiều; vượt tại đây không có lối thoát an toàn.";
    }
    if (includesAny(text, ["cầu hẹp", "đường sắt", "xe ưu tiên"])) {
      return "Cầu hẹp không có khoảng tránh, giao cắt đường sắt có nguy cơ tàu đến, còn xe ưu tiên phải được nhường; cả ba trường hợp đều không đủ điều kiện vượt an toàn.";
    }
    return "Vượt xe chỉ an toàn khi có đủ tầm nhìn và khoảng trống; báo hiệu rõ để xe trước cùng phương tiện ngược chiều dự đoán được thao tác.";
  }
  if (text.includes("đèn tín hiệu báo rẽ")) {
    return "Đèn báo rẽ phải bật trước khi xe dịch chuyển sang làn khác để xe phía sau nhận biết và điều chỉnh khoảng cách, không bật đồng thời với lúc đánh lái.";
  }
  if (includesAny(text, ["đèn", "chiếu gần", "chiếu xa"])) {
    if (text.includes("chiếu gần")) {
      return "Đèn chiếu gần vẫn bảo đảm vùng quan sát cần thiết nhưng không rọi chùm sáng cao vào mắt người đi ngược chiều, nhất là nơi đã có chiếu sáng đường phố.";
    }
    return "Dùng đúng loại đèn vừa giúp xe khác nhận biết hướng di chuyển, vừa tránh gây chói và làm giảm khả năng quan sát của người đối diện.";
  }
  if (includesAny(text, ["sử dụng điện thoại", "thiết bị điện tử"])) {
    return "Cầm và thao tác thiết bị làm mắt, tay và sự chú ý rời khỏi việc lái xe nên bị cấm khi đang điều khiển phương tiện.";
  }
  if (text.includes("quay đầu")) {
    return "Quay đầu làm xe cắt qua nhiều dòng giao thông, vì vậy chỉ được thực hiện nơi đủ tầm nhìn, đủ mặt đường và không thuộc vị trí cấm.";
  }
  if (text.includes("lùi xe")) {
    return "Khi lùi, điểm mù phía sau lớn và hướng quan sát ngược chiều chuyển động; người lái phải bảo đảm chắc chắn không có người hoặc xe trong quỹ đạo.";
  }
  if (includesAny(text, ["chuyển làn", "chuyển hướng", "rẽ trái", "rẽ phải"])) {
    return "Báo hiệu sớm, giảm tốc và quan sát điểm mù giúp phương tiện xung quanh có thời gian phản ứng trước khi xe cắt sang hướng khác.";
  }
  if (includesAny(text, ["trẻ em", "học sinh", "người đi bộ", "người khuyết tật"])) {
    return "Đây là nhóm dễ bị tổn thương trong giao thông, nên người lái phải giảm xung đột và dành đủ thời gian, không gian để họ di chuyển an toàn.";
  }
  if (includesAny(text, ["làn đường", "tránh xe đi ngược chiều", "đường cong", "lên dốc", "xuống dốc"])) {
    return "Đi đúng phần đường, giảm tốc ở nơi khuất tầm nhìn và nhường xe khó điều khiển hơn giúp hai luồng xe không cắt vào quỹ đạo của nhau.";
  }
  if (includesAny(text, ["dừng xe", "đỗ xe"])) {
    return "Vị trí dừng, đỗ phải giữ được tầm nhìn và phần đường lưu thông; chiếm làn hoặc che khuất nút giao sẽ tạo xung đột cho xe khác.";
  }
  if (includesAny(text, ["mô tô", "xe gắn máy"])) {
    if (includesAny(text, ["kéo", "đẩy", "bám"])) {
      return "Kéo, đẩy hoặc bám phương tiện khác làm hai xe phụ thuộc chuyển động lẫn nhau, dễ lệch hướng và ngã khi một bên phanh hoặc đổi hướng.";
    }
    if (text.includes("sử dụng ô")) {
      return "Ô che tầm nhìn, chịu lực gió và chiếm một tay giữ thăng bằng, nên người ngồi trên mô tô không được sử dụng khi xe đang chạy.";
    }
    return "Xe hai bánh dễ mất cân bằng và người ngồi trên xe ít được bảo vệ, nên mọi thao tác làm giảm khả năng điều khiển đều có rủi ro cao.";
  }
  if (includesAny(text, ["phà", "cầu phao"])) {
    return "Sắp xếp đúng thứ tự và giữ tải trọng ổn định giúp phương tiện lên xuống an toàn, không làm lệch hoặc ùn tắc phà, cầu phao.";
  }
  if (includesAny(text, ["xe ưu tiên", "nhường đường", "đường giao nhau", "vòng xuyến"])) {
    return "Quy tắc ưu tiên tạo một thứ tự thống nhất tại điểm xung đột; người không có quyền ưu tiên phải chủ động giảm tốc và nhường.";
  }
  if (includesAny(text, ["đường sắt", "đường ngang"])) {
    return "Tàu chạy trên đường ray không thể đổi hướng và cần quãng đường phanh rất dài, nên phương tiện đường bộ phải dừng ngoài phạm vi an toàn.";
  }
  if (text.includes("cao tốc")) {
    return "Trên cao tốc, chênh lệch tốc độ lớn nên chỉ một thao tác sai làn hoặc dừng không đúng chỗ cũng có thể gây va chạm dây chuyền.";
  }
  if (text.includes("hầm đường bộ")) {
    return "Không gian hầm kín và tầm thoát hạn chế nên xe phải bật đèn, giữ dòng lưu thông và chỉ dừng tại vị trí khẩn cấp khi thật sự bắt buộc.";
  }
  if (includesAny(text, ["xe kéo", "rơ moóc", "sơ mi rơ moóc", "thanh nối cứng"])) {
    return "Liên kết kéo phải chắc chắn và còn khả năng điều khiển; khi xe được kéo mất phanh, thanh nối cứng ngăn xe đó lao vào xe kéo.";
  }
  if (includesAny(text, ["độ tuổi", "tuổi tối đa", "giấy phép lái xe", "hạng a", "hạng b", "hạng c", "hạng d", "hạng e"])) {
    return "Mỗi độ tuổi và hạng giấy phép gắn với nhóm xe có khối lượng, số chỗ hoặc tổ hợp rơ moóc cụ thể; không được suy rộng sang hạng cao hơn.";
  }
  if (includesAny(text, ["thời gian lái", "liên tục", "nghỉ ngơi"])) {
    return "Giới hạn thời gian lái nhằm ngăn mệt mỏi tích lũy, vì phản xạ và khả năng phán đoán giảm rõ khi người lái thiếu nghỉ ngơi.";
  }
  if (includesAny(text, ["khoảng cách an toàn", "cự ly tối thiểu", "tốc độ tối đa", "giảm tốc độ"])) {
    return "Tốc độ càng cao thì quãng đường phản ứng và phanh càng dài; khoảng cách phải đủ để xe sau dừng lại nếu xe trước giảm tốc đột ngột.";
  }
  if (includesAny(text, ["điều kiện tham gia", "giấy tờ", "đăng ký xe", "giám sát hành trình", "tập lái"])) {
    return "Các điều kiện về người lái, giấy tờ và thiết bị giúp xác nhận đúng năng lực điều khiển, tình trạng phương tiện và trách nhiệm của chủ xe.";
  }
  if (includesAny(text, ["hàng hóa", "quá tải", "quá khổ", "xếp hàng"])) {
    return "Tải trọng và cách xếp hàng ảnh hưởng trực tiếp đến độ ổn định, quãng đường phanh, tầm nhìn và khả năng chịu tải của đường.";
  }
  if (includesAny(text, ["kinh doanh vận tải", "vận tải hành khách", "vận chuyển hành khách", "vận tải hàng hóa"])) {
    return "Các điều kiện vận tải giúp kiểm soát người lái, phương tiện và hành trình, qua đó bảo vệ hành khách, hàng hóa và người cùng tham gia giao thông.";
  }
  if (includesAny(text, ["động vật sống", "nước ngoài", "siêu trường", "siêu trọng", "cứu hộ giao thông"])) {
    if (text.includes("nước ngoài")) {
      return "Phương tiện nước ngoài chỉ được lưu hành theo phạm vi giấy phép và điều ước áp dụng; xe tay lái bên phải còn cần đi theo đoàn có phương tiện hướng dẫn.";
    }
    return "Đây là loại hình lưu thông có kích thước, tải trọng hoặc điều kiện quản lý đặc thù, nên phải tuân thủ đầy đủ giấy phép, báo hiệu và biện pháp hỗ trợ.";
  }
  return "Điểm quyết định là phải áp dụng đủ điều kiện nêu trong câu hỏi, không bỏ bớt phạm vi hoặc tự thêm ngoại lệ mà quy tắc không cho phép.";
}

function drivingInsight(question) {
  const text = normalizedQuestion(question);

  if (text.includes("xuống dốc")) {
    return "Số thấp tạo lực hãm bằng động cơ; phối hợp phanh đúng mức tránh phải rà phanh liên tục gây nóng và mất hiệu lực phanh.";
  }
  if (text.includes("lên dốc")) {
    return "Chọn số thấp từ sớm giúp xe đủ lực kéo, còn giảm tốc gần đỉnh dốc tạo thời gian xử lý xe ngược chiều bị khuất tầm nhìn.";
  }
  if (includesAny(text, ["khởi hành", "vào số"])) {
    return "Giữ phanh và kiểm tra đúng vị trí số ngăn xe chồm hoặc chạy sai hướng; nhả côn, phanh và tăng ga tuần tự giúp xe chuyển động êm.";
  }
  if (includesAny(text, ["tăng số", "giảm số", "hộp số"])) {
    return "Số truyền phải phù hợp tốc độ và tải của xe; phối hợp côn, ga nhịp nhàng tránh giật xe, chết máy hoặc mất lực kéo.";
  }
  if (includesAny(text, ["quay đầu", "rẽ trái", "rẽ phải", "đường vòng"])) {
    return "Giảm tốc trước khi đổi hướng và quan sát cả phía trước, sau lẫn điểm mù giúp xe đi đúng quỹ đạo mà không cắt bất ngờ vào dòng xe khác.";
  }
  if (text.includes("đường sắt")) {
    return "Quan sát và chọn số trước khi qua ray giúp xe không phải dừng hoặc chuyển số giữa đường sắt, nơi đặc biệt nguy hiểm nếu động cơ chết máy.";
  }
  if (text.includes("ngập nước")) {
    return "Giữ số thấp và ga đều hạn chế nước lọt vào đường nạp, đồng thời tránh tạo sóng nước hoặc mất lực kéo giữa vùng ngập.";
  }
  if (includesAny(text, ["ban đêm", "đèn của xe", "chiếu xa"])) {
    return "Chuyển đèn chiếu gần và nhìn chếch sang phải hạn chế lóa mắt nhưng vẫn giữ được mốc mép đường để điều khiển xe.";
  }
  if (includesAny(text, ["phanh", "dừng xe"])) {
    return "Phanh sớm và tăng lực từ từ giúp lốp duy trì độ bám, xe giữ thẳng hướng và phương tiện phía sau có thời gian phản ứng.";
  }
  if (includesAny(text, ["trơn", "mưa", "sương mù", "tầm nhìn"])) {
    return "Độ bám và tầm nhìn đều giảm trong điều kiện này, nên khoảng cách phải tăng còn các thao tác ga, phanh và lái cần nhẹ hơn.";
  }
  return "Trình tự đúng giữ cho người lái còn đủ thời gian quan sát, kiểm soát tốc độ và sửa sai trước khi tình huống trở nên nguy hiểm.";
}

function vehicleInsight(question) {
  const text = normalizedQuestion(question);

  if (includesAny(text, ["dầu bôi trơn", "hệ thống bôi trơn"])) {
    return "Dầu đúng mức và sạch tạo màng ngăn ma sát, mang nhiệt và cặn bẩn khỏi bề mặt làm việc; thiếu hoặc thừa dầu đều có thể hại động cơ.";
  }
  if (includesAny(text, ["lốp", "bánh xe"])) {
    return "Lốp là điểm tiếp xúc duy nhất với mặt đường, nên sai kích thước, mòn hoặc hư hỏng sẽ làm giảm độ bám và ổn định của xe.";
  }
  if (includesAny(text, ["phanh", "hãm"])) {
    return "Hệ thống phanh phải tạo lực hãm cân bằng và tin cậy để xe giảm tốc, dừng đúng quãng đường mà không bị lệch hướng.";
  }
  if (includesAny(text, ["hệ thống lái", "vô lăng"])) {
    return "Độ rơ và liên kết của hệ thống lái quyết định xe có phản ứng chính xác theo thao tác vô lăng hay không.";
  }
  if (includesAny(text, ["kính", "gương", "đèn"])) {
    return "Bộ phận quan sát và chiếu sáng phải cho hình ảnh rõ, đúng hướng để người lái nhận biết chướng ngại và để xe khác nhận ra phương tiện.";
  }
  if (includesAny(text, ["động cơ", "diesel", "xăng"])) {
    return "Động cơ chỉ làm việc ổn định khi nhiên liệu, không khí, bôi trơn và quá trình sinh công được cung cấp đúng điều kiện.";
  }
  if (includesAny(text, ["ly hợp", "hộp số", "truyền lực"])) {
    return "Cụm truyền lực tiếp nhận và biến đổi mô-men từ động cơ trước khi đưa tới bánh chủ động, nhờ đó xe khởi hành và thay đổi tốc độ phù hợp.";
  }
  if (text.includes("bảo dưỡng")) {
    return "Bảo dưỡng định kỳ phát hiện hao mòn trước khi thành hư hỏng, đồng thời duy trì độ tin cậy và tuổi thọ của phương tiện.";
  }
  if (text.includes("niên hạn")) {
    return "Niên hạn được tính từ năm sản xuất và là giới hạn pháp lý riêng theo loại xe, không căn cứ vào số năm chủ xe đã sử dụng.";
  }
  return "Yêu cầu kỹ thuật này liên quan trực tiếp đến khả năng quan sát, điều khiển hoặc độ bền của xe và phải được kiểm tra trước khi lưu thông.";
}

function signInsight(question) {
  const text = normalizedQuestion(question);

  if (text.includes("vạch")) {
    return "Cần đọc màu, kiểu liền hoặc đứt và vị trí vạch theo chiều xe chạy; cùng một nét vạch nhưng đặt ở vị trí khác có thể mang hiệu lực khác.";
  }
  if (includesAny(text, ["biển phụ", "phạm vi", "khoảng cách", "chiều dài đoạn đường"])) {
    return "Biển phụ không đứng độc lập mà bổ sung cự ly, hướng hoặc đối tượng cho biển chính ngay phía trên, nên phải đọc hai biển như một cụm.";
  }
  if (includesAny(text, ["ô tô tải", "xe tải", "máy kéo", "mô tô", "xe khách", "rơ moóc", "sơ mi rơ moóc"])) {
    return "Hình phương tiện bên trong vòng tròn cho biết đúng đối tượng bị tác động; nếu có con số hoặc biển phụ thì còn phải kiểm tra tải trọng và tổ hợp xe.";
  }
  if (text.includes("vượt")) {
    return "Ký hiệu hai xe đặt trong vòng tròn đỏ liên quan đến cấm vượt; loại xe được vẽ màu đen hoặc đỏ quyết định lệnh cấm áp dụng cho xe nào.";
  }
  if (includesAny(text, ["quay đầu", "rẽ trái", "rẽ phải"])) {
    return "Mũi tên mô tả đúng thao tác quay hoặc rẽ; vạch chéo đỏ phủ lên hướng nào thì hướng đó bị cấm, không tự động cấm các hướng còn lại.";
  }
  if (includesAny(text, ["dừng xe", "đỗ xe"])) {
    return "Biển nền xanh viền đỏ có một gạch chéo là cấm đỗ, hai gạch chéo là cấm cả dừng và đỗ; biển phụ hoặc mũi tên xác định phía có hiệu lực.";
  }
  if (includesAny(text, ["chiều cao", "chiều rộng", "chiều dài", "khối lượng", "trọng lượng"])) {
    return "Con số là giới hạn cho kích thước hoặc khối lượng được biểu thị bằng các mũi tên, nên phải đối chiếu cả xe và hàng trước khi đi qua.";
  }
  if (text.includes("tốc độ")) {
    return "Con số trong vòng tròn đỏ là tốc độ tối đa, còn vòng tròn xanh biểu thị tốc độ tối thiểu; gạch chéo báo kết thúc hạn chế tương ứng.";
  }
  if (includesAny(text, ["người đi bộ", "xe đạp"])) {
    return "Biểu tượng người hoặc xe đạp xác định đúng đối tượng và phần đường dành riêng; cần phân biệt biển cấm với biển chỉ dẫn lối đi.";
  }
  if (includesAny(text, ["đường ưu tiên", "hết đoạn đường ưu tiên"])) {
    return "Hình thoi vàng báo đường ưu tiên, còn biển kết thúc có thêm gạch chéo; tại nút giao phải đọc biển theo hướng xe đang đi tới.";
  }
  if (includesAny(text, ["đường sắt", "tàu điện"])) {
    return "Hình đầu máy, rào chắn hoặc dấu chữ thập cho biết dạng giao cắt đường sắt và mức cảnh báo để người lái chuẩn bị dừng.";
  }
  if (text.includes("cấm")) {
    return "Nhóm biển cấm thường có dạng tròn, viền đỏ; hình bên trong xác định đúng loại xe hoặc hành vi bị hạn chế, còn gạch chéo thể hiện nội dung cấm cụ thể.";
  }
  if (includesAny(text, ["nguy hiểm", "cảnh báo"])) {
    return "Biển cảnh báo nguy hiểm có dạng tam giác viền đỏ; hình vẽ bên trong cho biết loại nguy cơ để người lái giảm tốc và chuẩn bị xử lý.";
  }
  if (includesAny(text, ["hiệu lệnh", "phải đi", "hướng đi"])) {
    return "Biển hiệu lệnh dạng tròn nền xanh yêu cầu đi theo hướng hoặc cách thức biểu thị; đây là lệnh phải chấp hành, không chỉ là gợi ý.";
  }
  if (includesAny(text, ["chỉ dẫn", "bắt đầu", "kết thúc"])) {
    return "Biển chỉ dẫn cung cấp hướng đi hoặc phạm vi bắt đầu, kết thúc; ký hiệu gạch chéo thường báo hiệu quy định trước đó đã hết hiệu lực.";
  }
  return "Muốn phân biệt chính xác phải đọc đồng thời hình dạng, màu nền, viền và biểu tượng; không nên chỉ dựa vào một chi tiết giống nhau giữa các biển.";
}

function scenarioInsight(question, fact) {
  const text = normalizedQuestion(question);
  const normalizedFact = fact.toLocaleLowerCase("vi-VN");

  if (includesAny(text, ["thứ tự", "đi trước", "đi cuối cùng", "nhường đường"])) {
    return "Xác định lần lượt theo hiệu lệnh, xe ưu tiên, đường ưu tiên rồi mới áp dụng quy tắc nhường bên phải hoặc xe rẽ trái nhường xe đi thẳng.";
  }
  if (includesAny(text, ["vi phạm", "chấp hành", "được phép đi", "đi theo hướng nào"])) {
    return "Mỗi xe phải đối chiếu đúng tín hiệu với làn và hướng của chính mình; tín hiệu cho làn bên cạnh không làm phát sinh quyền đi cho xe đang xét.";
  }
  if (includesAny(normalizedFact, ["giảm tốc", "phanh", "dừng lại"])) {
    return "Giảm tốc từ sớm tạo thêm thời gian quan sát và giữ khoảng trống phanh, tránh phải đánh lái gấp khi diễn biến phía trước thay đổi.";
  }
  if (normalizedFact.includes("nhường")) {
    return "Chủ động nhường giúp tách các quỹ đạo xung đột; chỉ tiếp tục khi người hoặc xe được ưu tiên đã đi qua hoàn toàn.";
  }
  if (normalizedFact.includes("không được vượt")) {
    return "Vượt trong vị trí bị hạn chế tầm nhìn hoặc có đối tượng cần bảo vệ sẽ không còn đủ khoảng trống để quay về làn an toàn.";
  }
  if (normalizedFact.includes("sát lề")) {
    return "Đi về bên phải làm tăng khoảng cách với xe ngược chiều và dành phần đường xử lý cho tình huống đang phát sinh.";
  }
  return "Phải kiểm tra toàn bộ báo hiệu và khoảng trống quanh xe trước khi thực hiện; một hướng đi hợp lệ vẫn chưa an toàn nếu đang có người hoặc xe chiếm quỹ đạo.";
}

function signClaim(question, fact) {
  const source = cleanSentence(question.question);
  const answer = rawAnswer(question);
  let match = source.match(/^Biển(?: báo)? nào\s+(.+)$/iu);

  if (match) {
    return withFinalPeriod(`${answer} ${lowercaseFirst(match[1])}`);
  }

  match = source.match(/^Khi gặp biển nào(?: thì)?\s+(.+)$/iu);
  if (match) {
    return withFinalPeriod(`Khi gặp ${answer}, ${lowercaseFirst(match[1])}`);
  }

  match = source.match(/^Trong các biển báo.+?biển nào\s+(.+)$/iu);
  if (match) {
    return withFinalPeriod(`${answer} ${lowercaseFirst(match[1])}`);
  }

  if (includesAny(normalizedQuestion(question), ["có ý nghĩa", "ý nghĩa như thế nào"])) {
    return `Báo hiệu trong hình mang nghĩa: ${fact}.`;
  }

  return withFinalPeriod(uppercaseFirst(fact));
}

function scenarioClaim(question, fact) {
  const text = normalizedQuestion(question);
  const factSentence = withFinalPeriod(uppercaseFirst(fact));

  if (text.includes("thứ tự")) return `Thứ tự đúng là: ${fact}.`;
  if (text.includes("xe nào phải nhường")) return `${uppercaseFirst(fact)} phải nhường đường.`;
  if (includesAny(text, ["xe nào được quyền đi trước", "xe nào được đi trước"])) {
    return `${uppercaseFirst(fact)} được quyền đi trước.`;
  }
  if (text.includes("xe nào vi phạm")) return `${uppercaseFirst(fact)} vi phạm quy tắc trong hình.`;
  if (text.includes("xe nào chấp hành đúng")) return `${uppercaseFirst(fact)} chấp hành đúng hướng đi trong hình.`;
  if (includesAny(text, ["bạn xử lý như thế nào", "người lái xe phải làm gì"])) {
    return `Cách xử lý đúng: ${fact}.`;
  }
  if (text.includes("xe của bạn được đi theo hướng nào")) {
    return `Xe của bạn được ${fact}.`;
  }
  return factSentence;
}

function claimForQuestion(question, fact) {
  const text = normalizedQuestion(question);
  const answer = rawAnswer(question);
  const factSentence = withFinalPeriod(uppercaseFirst(fact));

  if (/là gì\?*$/u.test(text)) {
    const subject = cleanSentence(question.question.replace(/là gì\?*$/iu, ""));
    return `${subject} là ${fact}.`;
  }
  if (includesAny(text, ["bao nhiêu", "thời gian nào", "mấy giờ"])) {
    return `Mốc cần chọn là ${answer}.`;
  }
  if (includesAny(text, ["có được", "được phép"]) && /^(không|có|được)/iu.test(answer)) {
    return withFinalPeriod(answer);
  }
  if (question.chapter === 5) {
    return signClaim(question, fact);
  }
  if (question.chapter === 6) {
    return scenarioClaim(question, fact);
  }
  if (includesAny(text, ["bị cấm", "không được", "cấm "])) {
    return factSentence;
  }
  if (includesAny(text, ["phải làm gì", "cần thực hiện", "thao tác", "xử lý như thế nào"])) {
    return factSentence;
  }
  return factSentence;
}

function takeawayForQuestion(question, fact) {
  const text = normalizedQuestion(question);
  let prefix;

  if (question.chapter === 5) prefix = "Nhìn đủ hình, màu, ký hiệu";
  else if (question.chapter === 6) prefix = "Xét tín hiệu rồi đến quyền ưu tiên";
  else if (includesAny(text, ["bao nhiêu", "thời gian nào", "mấy giờ"])) prefix = "Chốt đúng mốc";
  else if (includesAny(text, ["bị cấm", "không được", "cấm "])) prefix = "Tránh tuyệt đối";
  else if (includesAny(text, ["phải làm gì", "thao tác", "xử lý như thế nào"])) prefix = "Nhớ đúng trình tự";
  else prefix = "Điểm cần nhớ";

  return withFinalPeriod(`${prefix}: ${shortened(fact)}`);
}

function buildExplanation(question) {
  const fact = answerFact(question);
  const claim = claimForQuestion(question, fact);
  let insight;

  switch (question.chapter) {
    case 1:
      insight = lawInsight(question, fact);
      break;
    case 3:
      insight = drivingInsight(question);
      break;
    case 4:
      insight = vehicleInsight(question);
      break;
    case 5:
      insight = signInsight(question);
      break;
    case 6:
      insight = scenarioInsight(question, fact);
      break;
    default:
      throw new Error(`Chưa có cách giải thích cho chương ${question.chapter}, câu ${question.id}`);
  }

  return {
    reason: `${claim} ${insight}`,
    takeaway: takeawayForQuestion(question, fact),
  };
}

const explanations = { ...existingExplanations };

for (const question of questions) {
  const isHandWrittenAdditional = question.id >= 16 && question.id <= 45;
  if (inlineExplanationIds.has(question.id) || isHandWrittenAdditional) continue;
  explanations[question.id] = buildExplanation(question);
}

const orderedExplanations = Object.fromEntries(
  Object.entries(explanations).sort(([left], [right]) => Number(left) - Number(right)),
);

await writeFile(
  explanationsUrl,
  `${JSON.stringify(orderedExplanations, null, 2)}\n`,
  "utf8",
);

console.log(`Đã tạo ${Object.keys(orderedExplanations).length} lời giải theo nội dung câu hỏi.`);
