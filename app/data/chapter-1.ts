export type TheoryTreeNode = {
  label: string;
  description?: string;
  children?: TheoryTreeNode[];
};

export type TheoryBlock =
  | { type: "paragraph"; text: string }
  | { type: "bullets"; title?: string; items: string[] }
  | { type: "table"; title?: string; columns: string[]; rows: string[][] }
  | { type: "tree"; title?: string; root: TheoryTreeNode }
  | { type: "note"; title: string; text: string };

export type TheorySection = {
  id: string;
  title: string;
  source?: string;
  blocks: TheoryBlock[];
};

export type TheoryChapter = {
  id: number;
  title: string;
  subtitle: string;
  source: string;
  updated: string;
  sections: TheorySection[];
};

export const chapter1Theory: TheoryChapter = {
  id: 1,
  title: "Quy định chung và quy tắc giao thông đường bộ",
  subtitle: "Tóm tắt theo Luật Trật tự, an toàn giao thông đường bộ số 36/2024/QH15",
  source: "Luật Trật tự, an toàn giao thông đường bộ số 36/2024/QH15, áp dụng từ 01/01/2025",
  updated: "Cập nhật 09/08/2026",
  sections: [
    {
      id: "duong-bo",
      title: "1. Loại đường bộ",
      source: "Điều 2 và các quy định về đường bộ",
      blocks: [
        {
          type: "table",
          title: "Phân loại theo chức năng phục vụ",
          columns: ["Loại đường", "Cách nhận biết"],
          rows: [
            ["Đường chính", "Bảo đảm giao thông chủ yếu cho các vùng, khu vực."],
            ["Đường nhánh", "Nối vào đường chính, phục vụ một khu vực nhất định."],
            ["Đường gom", "Gom và chuyển tiếp giao thông từ đường nhánh hoặc đường bên vào đường chính."],
            ["Đường bên", "Gom giao thông từ nơi đỗ xe, trạm dừng nghỉ và điểm phục vụ vào mạng đường."],
            ["Đường dành cho giao thông công cộng", "Dành riêng cho phương tiện giao thông công cộng."],
            ["Đường nội bộ", "Nằm trong khu dân cư, khu công nghiệp hoặc khu vực nội bộ."],
            ["Đường dành cho người đi bộ, xe đạp", "Dành riêng cho người đi bộ hoặc người đi xe đạp."],
          ],
        },
        {
          type: "table",
          title: "Phân loại theo cấp quản lý",
          columns: ["Loại đường", "Phạm vi kết nối", "Cấp quản lý"],
          rows: [
            ["Quốc lộ", "Thủ đô với trung tâm chính trị, kinh tế, văn hóa lớn", "Trung ương"],
            ["Tỉnh lộ", "Trung tâm hành chính tỉnh với các huyện", "Tỉnh"],
            ["Huyện lộ", "Trung tâm hành chính huyện với các xã", "Huyện"],
            ["Đường xã", "Các thôn, xóm trong xã", "Xã"],
            ["Đường đô thị", "Trong phạm vi nội thành, nội thị", "Đô thị"],
            ["Đường chuyên dùng", "Phục vụ mục đích riêng của tổ chức, cá nhân", "Chủ quản lý"],
          ],
        },
        {
          type: "note",
          title: "Cần nhớ",
          text: "Đường cao tốc là cấp kỹ thuật; một tuyến có thể đồng thời là đường đô thị, đường chính hoặc đường chuyên dùng.",
        },
      ],
    },
    {
      id: "cao-toc-khai-niem",
      title: "2. Đường cao tốc và cấu trúc đường bộ",
      source: "Điều 2, Điều 25 và quy định kỹ thuật đường bộ",
      blocks: [
        {
          type: "bullets",
          title: "Đường cao tốc",
          items: [
            "Chỉ dành cho các loại xe được phép tham gia giao thông trên cao tốc.",
            "Có dải phân cách tách hai chiều, không giao nhau cùng mức và chỉ cho xe ra, vào ở điểm nhất định.",
            "Có hàng rào, thiết bị phục vụ giao thông liên tục, an toàn và rút ngắn thời gian hành trình.",
          ],
        },
        {
          type: "tree",
          title: "Cấu trúc đường bộ",
          root: {
            label: "Đường bộ",
            children: [
              { label: "Phần đường xe chạy", description: "Nơi phương tiện giao thông đường bộ đi lại.", children: [{ label: "Làn đường", description: "Một phần của phần đường xe chạy, chia theo chiều dọc và đủ rộng để xe chạy an toàn." }] },
              { label: "Dải phân cách", description: "Phân chia hai chiều xe chạy hoặc các nhóm phương tiện." },
              { label: "Khổ giới hạn", description: "Khoảng trống giới hạn chiều rộng, chiều cao để xe và hàng hóa đi qua an toàn." },
              { label: "Vạch kẻ đường", description: "Chỉ sự phân chia làn, vị trí hoặc hướng đi và vị trí dừng." },
            ],
          },
        },
      ],
    },
    {
      id: "phuong-tien",
      title: "3. Phương tiện giao thông đường bộ",
      source: "Điều 2",
      blocks: [
        {
          type: "tree",
          title: "Ba nhóm phương tiện",
          root: {
            label: "Phương tiện giao thông đường bộ",
            children: [
              { label: "Xe cơ giới", description: "Ô tô, rơ moóc, sơ mi rơ moóc, mô tô, xe gắn máy, xe bốn bánh gắn động cơ và xe tương tự." },
              { label: "Xe thô sơ", description: "Xe đạp, xe đạp máy, xe đạp điện, xích lô, xe lăn, xe do vật nuôi kéo và xe tương tự." },
              { label: "Xe máy chuyên dùng", description: "Máy đào, ủi, xúc, kéo, gặt; xe tưới, quét đường, nâng hàng, cần cẩu và xe tương tự." },
            ],
          },
        },
        {
          type: "note",
          title: "Phân biệt",
          text: "Xe máy chuyên dùng là nhóm riêng, không gộp vào xe cơ giới. Người điều khiển xe máy chuyên dùng vẫn phải có giấy phép hoặc chứng chỉ phù hợp.",
        },
      ],
    },
    {
      id: "gplx",
      title: "4. Người lái xe và giấy phép lái xe",
      source: "Điều 57, Điều 58, Điều 59 và Điều 62",
      blocks: [
        {
          type: "table",
          title: "Độ tuổi tối thiểu",
          columns: ["Độ tuổi", "Được điều khiển / được cấp"],
          rows: [
            ["Đủ 16 tuổi", "Xe gắn máy."],
            ["Đủ 18 tuổi", "GPLX A1, A, B1, B, C1; chứng chỉ bồi dưỡng kiến thức pháp luật để điều khiển xe máy chuyên dùng."],
            ["Đủ 21 tuổi", "GPLX C, BE."],
            ["Đủ 24 tuổi", "GPLX D1, D2, C1E, CE."],
            ["Đủ 27 tuổi", "GPLX D, D1E, D2E, DE."],
          ],
        },
        {
          type: "tree",
          title: "Cây phân loại GPLX theo loại xe",
          root: {
            label: "Giấy phép lái xe",
            children: [
              { label: "Mô tô", children: [
                { label: "A1", description: "Mô tô hai bánh đến 125 cm³ hoặc đến 11 kW." },
                { label: "A", description: "Mô tô hai bánh trên 125 cm³ hoặc trên 11 kW; gồm xe hạng A1." },
                { label: "B1", description: "Mô tô ba bánh; gồm xe hạng A1." },
              ] },
              { label: "Ô tô", children: [
                { label: "B", description: "Chở người đến 08 chỗ; tải, chuyên dùng đến 3.500 kg." },
                { label: "C1", description: "Trên 3.500 kg đến 7.500 kg; gồm xe hạng B." },
                { label: "C", description: "Trên 7.500 kg; gồm xe hạng B và C1." },
                { label: "D1 / D2 / D", description: "Chở người trên 08 đến 16 chỗ; trên 16 đến 29 chỗ; trên 29 chỗ, xe buýt hoặc xe giường nằm." },
                { label: "BE / C1E / CE / D1E / D2E / DE", description: "Kéo rơ moóc có khối lượng toàn bộ theo thiết kế trên 750 kg theo hạng tương ứng." },
              ] },
            ],
          },
        },
        {
          type: "bullets",
          title: "Giấy tờ và điểm GPLX",
          items: [
            "Người lái xe phải đủ tuổi, đủ sức khỏe và có GPLX còn hiệu lực, phù hợp với loại xe; người lái xe gắn máy thực hiện theo quy định riêng.",
            "Khi tham gia giao thông cần có đăng ký xe, GPLX phù hợp, chứng nhận kiểm định và bảo hiểm bắt buộc theo loại xe.",
            "GPLX có 12 điểm. Không bị trừ điểm trong 12 tháng kể từ lần trừ gần nhất thì được phục hồi đủ 12 điểm; bị trừ hết điểm thì sau ít nhất 06 tháng được kiểm tra kiến thức để phục hồi.",
            "Không được giao xe cho người chưa đủ tuổi, không có GPLX hoặc GPLX đã bị trừ hết điểm.",
          ],
        },
      ],
    },
    {
      id: "con-nguoi",
      title: "5. Con người trong giao thông",
      source: "Điều 2",
      blocks: [
        {
          type: "tree",
          title: "Phân loại",
          root: {
            label: "Con người trong giao thông",
            children: [
              { label: "Người tham gia giao thông", children: [
                { label: "Người điều khiển phương tiện", children: [{ label: "Người lái xe", description: "Người điều khiển xe cơ giới." }, { label: "Người điều khiển xe thô sơ hoặc xe máy chuyên dùng" }] },
                { label: "Người được chở" },
                { label: "Người đi bộ" },
                { label: "Người điều khiển, dẫn dắt vật nuôi" },
              ] },
              { label: "Người điều khiển giao thông", description: "Cảnh sát giao thông hoặc người được giao nhiệm vụ hướng dẫn giao thông." },
            ],
          },
        },
        {
          type: "note",
          title: "Người đi bộ và người khuyết tật",
          text: "Tại vạch qua đường hoặc nơi người đi bộ, xe lăn của người khuyết tật đang qua đường, phải quan sát, giảm tốc độ hoặc dừng lại để bảo đảm an toàn.",
        },
      ],
    },
    {
      id: "bao-hieu",
      title: "6. Hệ thống báo hiệu và tín hiệu",
      source: "Điều 11",
      blocks: [
        {
          type: "table",
          title: "Thứ tự ưu tiên khi báo hiệu trái ngược",
          columns: ["Thứ tự", "Báo hiệu"],
          rows: [
            ["1", "Hiệu lệnh của người điều khiển giao thông."],
            ["2", "Tín hiệu đèn giao thông."],
            ["3", "Biển báo hiệu đường bộ."],
            ["4", "Vạch kẻ đường và dấu hiệu khác trên mặt đường."],
            ["5", "Cọc tiêu, tường bảo vệ, rào chắn, đinh/cột phản quang, cột Km, cọc H."],
            ["6", "Thiết bị âm thanh báo hiệu đường bộ."],
          ],
        },
        {
          type: "bullets",
          title: "Hiệu lệnh tay",
          items: [
            "Tay phải giơ thẳng đứng: tất cả các hướng phải dừng.",
            "Hai tay hoặc một tay dang ngang: phía trước và phía sau phải dừng; bên phải và bên trái được đi.",
            "Tay phải giơ về phía trước: phía sau và bên phải phải dừng; phía trước được rẽ phải; bên trái được đi tất cả các hướng; người đi bộ đi sau lưng người điều khiển.",
          ],
        },
        {
          type: "bullets",
          title: "Đèn giao thông",
          items: [
            "Đèn đỏ: cấm đi.",
            "Đèn vàng: phải dừng trước vạch; nếu đang trên hoặc đã qua vạch thì được đi tiếp. Đèn vàng nhấp nháy: được đi nhưng phải quan sát, giảm tốc độ và nhường đường.",
            "Đèn xanh: được đi; vẫn phải giảm tốc độ hoặc dừng để nhường người đi bộ, xe lăn đang ở lòng đường.",
          ],
        },
      ],
    },
    {
      id: "dung-do",
      title: "7. Dừng xe và đỗ xe",
      source: "Điều 18",
      blocks: [
        {
          type: "table",
          title: "So sánh dừng xe và đỗ xe",
          columns: ["Tiêu chí", "Dừng xe", "Đỗ xe"],
          rows: [
            ["Bản chất", "Đứng yên tạm thời.", "Đứng yên không giới hạn thời gian."],
            ["Tắt máy", "Không được tắt máy.", "Được tắt máy."],
            ["Rời vị trí lái", "Không được rời, trừ đóng/mở cửa, xếp dỡ, kiểm tra kỹ thuật và phải dùng phanh đỗ hoặc biện pháp an toàn.", "Chỉ được rời sau khi đã dùng phanh đỗ hoặc biện pháp an toàn khác."],
            ["Đường dốc", "Không có yêu cầu riêng về đánh lái/chèn bánh; vẫn phải giữ xe an toàn và không rời vị trí lái.", "Phải đánh lái về phía lề đường và chèn bánh."],
          ],
        },
        {
          type: "table",
          title: "Các vị trí không được dừng, đỗ",
          columns: ["Nhóm vị trí", "Quy tắc"],
          rows: [
            ["Đường một chiều, đường cong, đầu dốc", "Bên trái đường một chiều; nơi cong hoặc gần đầu dốc bị che khuất tầm nhìn."],
            ["Cầu, gầm cầu", "Trên cầu hoặc dưới gầm cầu vượt, trừ nơi được tổ chức giao thông cho phép."],
            ["Giao nhau, đường sắt", "Nơi giao nhau, phạm vi 05 m từ mép giao nhau và trong phạm vi an toàn đường sắt."],
            ["Người đi bộ, điểm đón trả", "Phần đường dành cho người đi bộ qua đường; điểm đón, trả khách."],
            ["Che khuất báo hiệu", "Nơi che khuất biển báo hoặc đèn tín hiệu giao thông."],
            ["Lòng đường, vỉa hè", "Đường dành riêng cho xe buýt, miệng cống/hầm kỹ thuật, chỗ xe chữa cháy lấy nước hoặc lòng đường, vỉa hè trái phép."],
          ],
        },
        {
          type: "bullets",
          title: "Khi ra, vào vị trí dừng đỗ",
          items: [
            "Có tín hiệu báo cho phương tiện khác biết và không làm ảnh hưởng người đi bộ, phương tiện khác.",
            "Nếu có lề đường rộng hoặc khu đất ngoài phần đường xe chạy thì ưu tiên dừng, đỗ tại đó.",
            "Trên đường phố, dừng đỗ sát lề hoặc vỉa hè bên phải; bánh xe gần nhất không cách quá 0,25 m.",
          ],
        },
      ],
    },
    {
      id: "hanh-vi-cam",
      title: "8. Các hành vi bị nghiêm cấm",
      source: "Điều 9",
      blocks: [
        {
          type: "bullets",
          title: "Nhóm cần nhớ",
          items: [
            "Không có GPLX hoặc giấy tờ/chứng chỉ điều khiển phù hợp; giao xe cho người không đủ điều kiện.",
            "Có nồng độ cồn; có ma túy hoặc chất kích thích bị cấm; dùng tay cầm điện thoại khi xe đang di chuyển.",
            "Đua xe trái phép; lạng lách, đánh võng, rú ga liên tục; xúc phạm, chống đối hoặc cản trở người thi hành công vụ.",
            "Đưa phương tiện không bảo đảm an toàn kỹ thuật, bảo vệ môi trường hoặc chất lượng vào giao thông; cải tạo trái phép; gian lận kiểm định.",
            "Chở quá tải, quá số người, hàng cấm/hàng nguy hiểm trái phép hoặc không chằng buộc hàng hóa đúng quy định.",
            "Đe dọa, cưỡng ép, tranh giành hành khách; lắp thiết bị âm thanh/ánh sáng gây mất an toàn.",
            "Sản xuất, sử dụng, mua bán biển số trái phép; gắn sai, che lấp, bẻ cong hoặc làm thay đổi biển số.",
            "Làm sai lệch dữ liệu giám sát hành trình/camera; phá hoại thiết bị điều khiển, giám sát giao thông.",
            "Đặt chướng ngại vật, rải vật sắc nhọn, đổ chất trơn trượt, làm rơi vãi đất đá/hóa chất/chất thải trên đường.",
            "Cản trở người, phương tiện; ném vật thể vào người hoặc phương tiện; bỏ trốn sau tai nạn hoặc cố ý không cứu giúp.",
            "Lợi dụng chức vụ, nhiệm vụ để vi phạm hoặc can thiệp xử lý vi phạm; điều khiển vật thể bay trong khổ giới hạn đường bộ gây nguy hiểm khi chưa được phép.",
          ],
        },
      ],
    },
    {
      id: "chuyen-huong",
      title: "9. Chuyển hướng, vượt, lùi, quay đầu và tránh xe",
      source: "Điều 14 đến Điều 17",
      blocks: [
        {
          type: "bullets",
          items: [
            "Chuyển hướng: quan sát, giảm tốc độ, báo tín hiệu liên tục, chuyển dần sang làn gần hướng rẽ và nhường người đi bộ, xe thô sơ, xe đi ngược chiều.",
            "Vượt xe: chỉ vượt khi đủ điều kiện an toàn, báo hiệu và giữ khoảng cách; không vượt ở nơi cấm vượt, cầu hẹp, đường giao nhau, đường cong bị che khuất hoặc nơi nguy hiểm.",
            "Lùi xe: quan sát hai bên và phía sau, có tín hiệu lùi; không lùi ở đường một chiều, khu vực cấm dừng, nơi giao nhau, hầm, cao tốc hoặc tầm nhìn bị che khuất.",
            "Quay đầu: không quay đầu ở phần đường người đi bộ, cầu, đường sắt, đường dốc, đường cong che khuất, cao tốc, hầm và đường một chiều, trừ hiệu lệnh hoặc biển báo cho phép.",
            "Tránh xe ngược chiều: giảm tốc độ, đi về bên phải; xe xuống dốc nhường xe lên dốc; xe có chướng ngại vật nhường xe không có chướng ngại vật.",
          ],
        },
      ],
    },
    {
      id: "giao-nhau-uu-tien",
      title: "10. Nơi đường giao nhau và xe ưu tiên",
      source: "Điều 22 và Điều 27",
      blocks: [
        {
          type: "bullets",
          items: [
            "Không có báo hiệu vòng xuyến: nhường xe đến từ bên phải; có báo hiệu vòng xuyến: nhường xe đến từ bên trái.",
            "Từ đường không ưu tiên hoặc đường nhánh phải nhường xe trên đường ưu tiên hoặc đường chính.",
            "Xe ưu tiên gồm xe chữa cháy, quân sự/công an/kiểm sát làm nhiệm vụ khẩn cấp, xe CSGT dẫn đường, xe cứu thương, xe hộ đê, xe cứu nạn và đoàn xe tang.",
            "Khi gặp xe ưu tiên có tín hiệu, phải giảm tốc độ, đi sát lề phải hoặc dừng lại nhường đường.",
          ],
        },
      ],
    },
    {
      id: "toc-do-khoang-cach",
      title: "11. Tốc độ và khoảng cách an toàn",
      source: "Điều 12 và quy định tốc độ hiện hành",
      blocks: [
        {
          type: "table",
          title: "Khoảng cách tối thiểu trong điều kiện mặt đường khô, tầm nhìn bảo đảm",
          columns: ["Tốc độ", "Khoảng cách tối thiểu"],
          rows: [["60 km/h", "35 m"], ["Trên 60 đến 80 km/h", "55 m"], ["Trên 80 đến 100 km/h", "70 m"], ["Trên 100 đến 120 km/h", "100 m"], ["Dưới 60 km/h", "Chủ động giữ khoảng cách phù hợp thực tế."]],
        },
        {
          type: "bullets",
          title: "Phải quan sát, giảm tốc hoặc dừng",
          items: [
            "Khi có cảnh báo nguy hiểm, chướng ngại vật, chuyển hướng, tầm nhìn hạn chế, đường hẹp, đường cong, đèo dốc, cầu cống hẹp hoặc hầm.",
            "Gần trường học, bệnh viện, bến xe, chợ, nơi đông người, công trường, hiện trường tai nạn hoặc có vật nuôi trên đường.",
            "Khi tránh xe ngược chiều, cho xe sau vượt, gặp xe ưu tiên, đoàn người đi bộ hoặc điều kiện thời tiết, mặt đường bất lợi.",
          ],
        },
      ],
    },
    {
      id: "coi-den",
      title: "12. Sử dụng còi và đèn",
      source: "Điều 20 và Điều 21",
      blocks: [
        {
          type: "bullets",
          items: [
            "Còi chỉ dùng để báo nguy cơ mất an toàn hoặc báo hiệu chuẩn bị vượt; không dùng còi liên tục, còi sai âm lượng.",
            "Trong khu đông dân cư và khu vực cơ sở khám chữa bệnh, không dùng còi từ 22 giờ đến 05 giờ, trừ xe ưu tiên.",
            "Bật đèn chiếu sáng phía trước từ 18 giờ đến 06 giờ hoặc khi thời tiết làm hạn chế tầm nhìn; bật đèn chiếu gần trong khu đông dân cư có chiếu sáng và khi gặp xe ngược chiều.",
            "Trong hầm: xe cơ giới, xe máy chuyên dùng bật đèn chiếu gần; xe thô sơ bật đèn hoặc có vật phát sáng.",
          ],
        },
      ],
    },
    {
      id: "mo-to",
      title: "13. Quy định riêng cho xe mô tô, xe gắn máy",
      source: "Quy tắc giao thông đường bộ",
      blocks: [
        {
          type: "bullets",
          items: [
            "Người lái và người được chở phải đội mũ bảo hiểm đúng quy chuẩn và cài quai đúng cách.",
            "Xe mô tô hai bánh, xe gắn máy được chở tối đa hai người trong trường hợp cấp cứu, áp giải, chở trẻ em dưới 12 tuổi, người già yếu hoặc người khuyết tật.",
            "Không dàn hàng ngang, buông hai tay, đứng/nằm trên xe, thay người lái khi xe chạy, kéo đẩy xe khác, chở vật cồng kềnh hoặc dùng ô.",
            "Người được chở không được mang vật cồng kềnh, bám kéo phương tiện khác hoặc dùng tay cầm điện thoại.",
          ],
        },
      ],
    },
    {
      id: "cao-toc-quy-tac",
      title: "14. Quy định về đường cao tốc",
      source: "Điều 25",
      blocks: [
        {
          type: "bullets",
          items: [
            "Không cho người đi bộ, xe thô sơ, mô tô, xe gắn máy, xe bốn bánh gắn động cơ và xe tương tự đi trên cao tốc, trừ lực lượng/phương tiện phục vụ quản lý, bảo trì.",
            "Không dừng, đỗ, lùi, quay đầu hoặc chạy trên làn dừng khẩn cấp khi ùn tắc; chỉ dừng khẩn cấp khi có sự cố hoặc bất khả kháng.",
            "Khi sự cố: vào làn dừng khẩn cấp, bật đèn khẩn cấp; nếu không vào được, đặt cảnh báo phía sau tối thiểu 150 m và báo cơ quan chức năng.",
            "Nhập làn phải báo hiệu, nhường xe đang chạy và dùng làn tăng tốc nếu có; ra làn phải chuyển dần sang bên phải, dùng làn giảm tốc nếu có.",
          ],
        },
      ],
    },
    {
      id: "duong-sat-ham",
      title: "15. Đường sắt và hầm đường bộ",
      source: "Điều 24 và Điều 26",
      blocks: [
        {
          type: "bullets",
          items: [
            "Tại đường ngang có tín hiệu đỏ, chuông, chắn hoặc hiệu lệnh gác chắn: dừng trước vạch về bên phải đường.",
            "Đường ngang không có người gác, chắn, chuông, đèn: vẫn phải dừng, quan sát hai phía và chỉ đi khi an toàn.",
            "Trong hầm phải bật đèn theo loại xe; không dừng, đỗ, quay đầu, lùi, trừ trường hợp sự cố buộc phải vào vị trí khẩn cấp và phát cảnh báo.",
          ],
        },
      ],
    },
    {
      id: "keo-day",
      title: "16. Kéo xe, đẩy xe",
      source: "Quy tắc giao thông đường bộ",
      blocks: [
        {
          type: "bullets",
          items: [
            "Xe được kéo phải có người điều khiển và hệ thống lái còn hiệu lực; nối xe chắc chắn, an toàn.",
            "Nếu hệ thống hãm xe được kéo không còn hiệu lực thì phải nối bằng thanh nối cứng.",
            "Xe kéo và xe được kéo phải có biển báo, đèn cảnh báo nhấp nháy màu vàng theo quy định.",
            "Xe mô tô hai bánh, ba bánh và xe gắn máy không được kéo hoặc đẩy phương tiện khác.",
          ],
        },
      ],
    },
    {
      id: "van-tai",
      title: "17. Vận tải đường bộ",
      source: "Điều 44 đến Điều 48",
      blocks: [
        {
          type: "bullets",
          items: [
            "Đón, trả khách đúng nơi; không chở khách trên nóc, trong khoang hành lý hoặc để khách đu bám bên ngoài xe.",
            "Không đe dọa, xúc phạm, tranh giành, lôi kéo hoặc cưỡng ép hành khách; không chuyển tải để trốn tránh kiểm tra quá tải, quá số người.",
            "Trước khi khởi hành phải kiểm tra điều kiện an toàn và hướng dẫn hành khách về an toàn, thoát hiểm.",
            "Thời gian lái xe liên tục không quá 04 giờ; thời gian làm việc trong ngày không quá 10 giờ theo nội dung ôn tập hiện hành.",
            "Hàng nguy hiểm, động vật sống, hàng siêu trường siêu trọng phải có giấy tờ, phương tiện và biện pháp bảo đảm an toàn phù hợp.",
          ],
        },
      ],
    },
    {
      id: "tre-em",
      title: "18. Trẻ em trên xe ô tô",
      source: "Điều 10 và quy định về xe đưa đón trẻ em",
      blocks: [
        {
          type: "bullets",
          items: [
            "Trẻ em dưới 10 tuổi và cao dưới 1,35 m không được ngồi cùng hàng ghế với người lái, trừ xe chỉ có một hàng ghế.",
            "Người lái phải sử dụng và hướng dẫn sử dụng thiết bị an toàn phù hợp cho trẻ em.",
            "Xe đưa đón trẻ em mầm non, học sinh phải có thiết bị ghi nhận hình ảnh và thiết bị cảnh báo, chống bỏ quên trẻ em theo quy định.",
          ],
        },
        {
          type: "note",
          title: "Nguồn và phạm vi",
          text: "Nội dung này là bản tóm tắt học nhanh cho 180 câu của Chương I, không thay thế toàn văn luật, nghị định xử phạt hoặc quy chuẩn kỹ thuật.",
        },
      ],
    },
  ],
};
