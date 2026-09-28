export interface Scenario {
  id: string;
  title: string;
  context: string;
  role: string;
}

export interface ScenarioKeyword {
  id: string;
  label: string;
  scenarios: Scenario[];
}

export interface ScenarioCategory {
  id: string;
  label: string;
  keywords: ScenarioKeyword[];
}

const behaviorKeywords = [
  "Onboarding",
  "Activation",
  "Retention",
  "Search & Discovery",
  "Trust",
  "Collaboration",
  "Notifications",
  "Accessibility",
  "Pricing",
  "Migration",
  "Error Recovery",
  "Metrics Trade-off",
];

function scenario(id: string, title: string, context: string, role: string): Scenario {
  return { id, title, context, role };
}

function keyword(id: string, label: string, scenarios: Scenario[]): ScenarioKeyword {
  return { id, label, scenarios };
}

function category(id: string, label: string, keywords: ScenarioKeyword[]): ScenarioCategory {
  return { id, label, keywords };
}

export const scenarioLibrary: ScenarioCategory[] = [
  category("ai", "AI", [
    keyword("trust", "Trust in AI Suggestions", [
      scenario("ai-trust-1", "Ngại dùng gợi ý AI", "Người dùng thử tính năng AI viết mô tả sản phẩm nhưng thường xoá kết quả và tự viết lại. Dashboard chỉ cho thấy lượt dùng ban đầu cao, còn tỉ lệ giữ lại gợi ý thấp.", "Bạn là Product Designer phụ trách AI assist trong công cụ tạo nội dung."),
      scenario("ai-trust-2", "AI trả lời quá tự tin", "Người dùng nội bộ hỏi trợ lý AI về chính sách công ty. Họ mở nhiều câu trả lời nhưng vẫn nhắn hỏi HR vì không chắc câu trả lời có đáng tin không.", "Bạn là Product Designer cho assistant nội bộ."),
    ]),
    keyword("control", "User Control", [
      scenario("ai-control-1", "Không biết sửa output AI", "Creator dùng AI tạo outline video nhưng bỏ cuộc ở bước chỉnh sửa vì không rõ nên điều khiển AI bằng prompt hay edit thủ công.", "Bạn thiết kế trải nghiệm co-creation với AI."),
      scenario("ai-control-2", "Tự động hóa gây lo lắng", "Team support được đề xuất tự động gửi phản hồi cho khách hàng, nhưng agent tắt tính năng dù hệ thống báo tiết kiệm thời gian.", "Bạn thiết kế AI workflow cho B2B support."),
    ]),
  ]),
  category("business", "Business", [
    keyword("dashboard", "Decision Dashboard", [
      scenario("business-dashboard-1", "Dashboard nhiều nhưng quyết định chậm", "Manager mở dashboard hằng ngày nhưng vẫn hỏi analyst trước khi ra quyết định. Số lượt xem dashboard tăng nhưng thời gian ra quyết định không giảm.", "Bạn thiết kế analytics dashboard cho đội vận hành."),
      scenario("business-dashboard-2", "Chỉ số bị hiểu sai", "Một team tối ưu số lead mới, nhưng sales báo chất lượng lead giảm và tốn nhiều thời gian lọc.", "Bạn thiết kế product metrics experience cho SaaS B2B."),
    ]),
    keyword("approval", "Approval Workflow", [
      scenario("business-approval-1", "Duyệt chi phí bị kẹt", "Nhân viên tạo request mua công cụ mới nhưng nhiều request nằm ở trạng thái chờ quá lâu vì không rõ ai đang giữ bước tiếp theo.", "Bạn thiết kế workflow approval nội bộ."),
      scenario("business-approval-2", "Quản lý duyệt qua loa", "Tỉ lệ duyệt request tăng sau khi thêm approve nhanh, nhưng finance phát hiện nhiều request thiếu thông tin.", "Bạn thiết kế lại trải nghiệm approval có guardrail."),
    ]),
  ]),
  category("collaboration", "Collaboration", [
    keyword("handoff", "Handoff", [
      scenario("collab-handoff-1", "Handoff bị mất ngữ cảnh", "Designer bàn giao file cho engineering nhưng developer thường hỏi lại trong chat vì không hiểu quyết định thiết kế và edge cases.", "Bạn thiết kế handoff workflow trong công cụ collaboration."),
      scenario("collab-handoff-2", "Comment nhiều nhưng ít rõ", "Số comment trên tài liệu tăng nhưng deadline vẫn trễ vì các comment không dẫn đến quyết định rõ ràng.", "Bạn cải thiện collaboration cho team cross-functional."),
    ]),
    keyword("async", "Async Work", [
      scenario("collab-async-1", "Async update bị bỏ qua", "Team remote có kênh update hằng ngày, nhưng nhiều thành viên không đọc và vẫn hỏi lại trong meeting.", "Bạn thiết kế trải nghiệm async status."),
      scenario("collab-async-2", "Quá nhiều notification", "Người dùng tắt notification của workspace vì bị ping liên tục, sau đó lại bỏ lỡ quyết định quan trọng.", "Bạn thiết kế notification system cho collaboration tool."),
    ]),
  ]),
  category("communication", "Communication", [
    keyword("messaging", "Messaging", [
      scenario("comm-msg-1", "Tin nhắn quan trọng bị trôi", "Trong app nhắn tin cho phụ huynh và giáo viên, thông báo khẩn thường bị lẫn với tin nhắn thường ngày.", "Bạn thiết kế luồng ưu tiên thông tin quan trọng."),
      scenario("comm-msg-2", "Người mới ngại nhắn", "User mới vào community đọc nhiều nhưng ít gửi tin đầu tiên vì không chắc chuẩn mực nhóm.", "Bạn thiết kế activation cho community messaging."),
    ]),
    keyword("calling", "Calling", [
      scenario("comm-call-1", "Cuộc gọi bị bỏ lỡ", "Người dùng bỏ lỡ nhiều cuộc gọi dịch vụ vì không nhận ra cuộc gọi nào đáng nghe và cuộc gọi nào là spam.", "Bạn thiết kế trải nghiệm nhận cuộc gọi trong app dịch vụ."),
      scenario("comm-call-2", "Không biết follow-up sau call", "Sau cuộc gọi tư vấn, người dùng ít mở lại summary hoặc next steps dù đã đồng ý trong cuộc gọi.", "Bạn thiết kế post-call experience."),
    ]),
  ]),
  category("crm", "CRM", [
    keyword("data-entry", "Data Entry", [
      scenario("crm-entry-1", "Sales không cập nhật CRM", "Sales rep thường cập nhật CRM cuối ngày thay vì ngay sau cuộc gọi, khiến dữ liệu pipeline thiếu và manager dự báo sai.", "Bạn thiết kế CRM workflow cho sales team."),
      scenario("crm-entry-2", "Trường dữ liệu bị bỏ trống", "Form opportunity có nhiều trường optional; các trường quan trọng cho forecast lại thường bị bỏ trống.", "Bạn thiết kế data quality experience trong CRM."),
    ]),
    keyword("migration", "Migration from Old Tools", [
      scenario("crm-migration-1", "Quay lại spreadsheet", "Team đã mua CRM mới nhưng vẫn duy trì spreadsheet riêng vì thấy CRM chậm và khó tìm thông tin.", "Bạn thiết kế adoption cho CRM mới."),
      scenario("crm-migration-2", "Dữ liệu cũ không đáng tin", "Sau import dữ liệu, người dùng không tin record vì thông tin trùng lặp và ngày cập nhật không rõ.", "Bạn thiết kế trải nghiệm migration và trust recovery."),
    ]),
  ]),
  category("developer-tools", "Developer Tools", [
    keyword("setup", "Setup & First Run", [
      scenario("dev-setup-1", "Quickstart bị rơi rụng", "Developer đăng ký dùng API nhưng nhiều người không gọi request đầu tiên thành công trong 30 phút.", "Bạn thiết kế onboarding cho developer platform."),
      scenario("dev-setup-2", "Docs được xem nhiều nhưng ít tích hợp", "Trang docs có traffic cao, nhưng số project production dùng SDK thấp.", "Bạn thiết kế activation metrics cho developer docs."),
    ]),
    keyword("debugging", "Debugging", [
      scenario("dev-debug-1", "Log lỗi khó hành động", "Người dùng thấy error log nhưng không biết lỗi đến từ API key, quota hay payload sai.", "Bạn thiết kế error recovery cho developer tool."),
      scenario("dev-debug-2", "Alert fatigue", "Team nhận quá nhiều alert từ monitoring nên tắt bớt rule và bỏ lỡ sự cố thật.", "Bạn thiết kế trải nghiệm alert triage."),
    ]),
  ]),
  category("education", "Education", [
    keyword("learning-progress", "Learning Progress", [
      scenario("edu-progress-1", "Bắt đầu nhiều, hoàn thành ít", "Học viên đăng ký khóa học cao nhưng nhiều người dừng ở bài thứ ba. Completion giảm dù số phút học trung bình tăng.", "Bạn thiết kế learning experience cho app học online."),
      scenario("edu-progress-2", "Không biết mình yếu ở đâu", "Người học làm quiz nhưng không hiểu kỹ năng nào cần luyện thêm, nên chọn bài học tiếp theo ngẫu nhiên.", "Bạn thiết kế feedback loop cho edtech."),
    ]),
    keyword("assignments", "Assignments", [
      scenario("edu-assign-1", "Nộp bài trễ", "Sinh viên thường nộp bài trễ trên hệ thống học tập dù deadline hiển thị ở nhiều nơi.", "Bạn thiết kế assignment flow cho LMS."),
      scenario("edu-assign-2", "Không chắc đã nộp thành công", "Sau khi upload bài, sinh viên quay lại kiểm tra nhiều lần vì không tin trạng thái nộp bài.", "Bạn thiết kế confirmation và trust state."),
    ]),
  ]),
  category("entertainment", "Entertainment", [
    keyword("discovery", "Discovery", [
      scenario("ent-discovery-1", "Duyệt lâu nhưng ít xem", "Người dùng lướt nội dung rất lâu nhưng ít bấm xem, làm engagement tăng còn satisfaction giảm.", "Bạn thiết kế content discovery cho streaming app."),
      scenario("ent-discovery-2", "Recommendation bị lặp", "Người dùng nghe nhạc thấy đề xuất quá giống nhau và ít khám phá nghệ sĩ mới.", "Bạn thiết kế recommendation controls."),
    ]),
    keyword("watching", "Watching Video", [
      scenario("ent-watch-1", "Bỏ dở giữa tập", "Nhiều người bắt đầu xem series mới nhưng dừng ở giữa tập đầu, không rõ do nội dung, thời lượng hay context xem.", "Bạn thiết kế activation cho video product."),
      scenario("ent-watch-2", "Auto-play tăng view nhưng bị phàn nàn", "Auto-play giúp tăng số lượt xem nhưng support nhận nhiều phản hồi về cảm giác mất kiểm soát.", "Bạn đánh giá trade-off metric cho streaming."),
    ]),
  ]),
  category("finance", "Finance", [
    keyword("trust", "Trust & Risk", [
      scenario("fin-trust-1", "Không hiểu trạng thái giao dịch", "Người dùng chuyển tiền xong thấy trạng thái pending và liên hệ support dù giao dịch thường hoàn tất sau vài phút.", "Bạn thiết kế transaction status cho fintech."),
      scenario("fin-trust-2", "Ngại liên kết tài khoản ngân hàng", "Người dùng bỏ dở ở bước liên kết ngân hàng vì lo về quyền truy cập và bảo mật.", "Bạn thiết kế onboarding cho fintech."),
    ]),
    keyword("budgeting", "Budgeting", [
      scenario("fin-budget-1", "Thiết lập ngân sách rồi bỏ", "Người dùng tạo budget tháng đầu nhưng không quay lại cập nhật sau khi chi tiêu vượt mức.", "Bạn thiết kế retention cho personal finance."),
      scenario("fin-budget-2", "Cảnh báo chi tiêu bị tắt", "Notification cảnh báo vượt ngân sách có open rate cao lúc đầu nhưng nhiều người tắt sau hai tuần.", "Bạn thiết kế notification strategy có guardrail."),
    ]),
  ]),
  category("food-drink", "Food & Drink", [
    keyword("ordering", "Ordering", [
      scenario("food-order-1", "Bỏ giỏ ở bước phí giao hàng", "Người dùng thêm món vào giỏ nhưng rời đi khi thấy tổng tiền sau phí và phụ thu.", "Bạn thiết kế checkout cho food delivery."),
      scenario("food-order-2", "Không chọn được món", "Nhóm bạn mở app đặt đồ ăn nhưng mất nhiều thời gian chọn vì khẩu vị và ràng buộc ăn uống khác nhau.", "Bạn thiết kế group ordering experience."),
    ]),
    keyword("reorder", "Reorder", [
      scenario("food-reorder-1", "Ít đặt lại món quen", "Người dùng từng đánh giá món 5 sao nhưng ít reorder vì app ưu tiên discovery hơn thói quen.", "Bạn thiết kế retention cho food app."),
      scenario("food-reorder-2", "Món cũ thay đổi chất lượng", "Người dùng reorder cùng nhà hàng nhưng phàn nàn chất lượng không ổn định, trust với đề xuất giảm.", "Bạn thiết kế feedback loop cho marketplace food."),
    ]),
  ]),
  category("graphic-design", "Graphic Design", [
    keyword("templates", "Templates", [
      scenario("design-template-1", "Template nhiều nhưng khó chọn", "Người dùng mới xem rất nhiều template nhưng không bắt đầu chỉnh sửa vì không biết template nào phù hợp mục tiêu.", "Bạn thiết kế template discovery cho design tool."),
      scenario("design-template-2", "Xuất bản thiết kế kém tự tin", "Người dùng hoàn tất poster nhưng không download vì sợ thiết kế nhìn thiếu chuyên nghiệp.", "Bạn thiết kế confidence-building flow."),
    ]),
    keyword("editing", "Editing & Updating", [
      scenario("design-edit-1", "Chỉnh sửa phá layout", "Người dùng thay chữ trong template và layout bị vỡ, dẫn đến undo liên tục và bỏ cuộc.", "Bạn thiết kế editing guardrails."),
      scenario("design-edit-2", "Không tìm thấy công cụ cơ bản", "Người mới mất nhiều thời gian tìm crop, align và export dù toolbar có đủ tính năng.", "Bạn thiết kế information architecture cho editor."),
    ]),
  ]),
  category("health-fitness", "Health & Fitness", [
    keyword("habit", "Habit Formation", [
      scenario("health-habit-1", "Theo dõi thói quen bị đứt quãng", "Người dùng ghi workout đều trong tuần đầu nhưng dừng khi bỏ lỡ hai ngày liên tiếp.", "Bạn thiết kế habit recovery cho fitness app."),
      scenario("health-habit-2", "Goal quá tham vọng", "Người dùng chọn mục tiêu giảm cân nhanh, sau đó churn khi progress thực tế chậm hơn kỳ vọng.", "Bạn thiết kế goal setting experience."),
    ]),
    keyword("accessibility", "Accessibility", [
      scenario("health-access-1", "Bài tập không phù hợp thể trạng", "Người dùng có hạn chế vận động nhận bài tập quá khó và rời app sau buổi đầu.", "Bạn thiết kế personalization cho fitness."),
      scenario("health-access-2", "Dữ liệu sức khỏe gây lo", "App hiển thị chỉ số bất thường nhưng không giải thích ngữ cảnh, khiến người dùng hoang mang.", "Bạn thiết kế feedback sức khỏe có trách nhiệm."),
    ]),
  ]),
  category("recruitment", "Recruitment", [
    keyword("candidate-flow", "Candidate Flow", [
      scenario("rec-candidate-1", "Ứng viên bỏ form", "Ứng viên bắt đầu apply nhưng bỏ ở bước nhập kinh nghiệm vì form dài và phải lặp lại CV.", "Bạn thiết kế application flow."),
      scenario("rec-candidate-2", "Không tin trạng thái hồ sơ", "Ứng viên liên tục hỏi recruiter vì portal chỉ hiện 'in review' trong nhiều tuần.", "Bạn thiết kế transparency cho candidate experience."),
    ]),
    keyword("screening", "Screening", [
      scenario("rec-screen-1", "AI screening bị nghi ngờ", "Hiring manager không tin ranking ứng viên do AI đưa ra vì thiếu lý do và dấu hiệu bias.", "Bạn thiết kế AI-assisted recruiting workflow."),
      scenario("rec-screen-2", "Nhiều filter làm mất ứng viên tốt", "Recruiter dùng filter nhanh hơn nhưng số ứng viên đa dạng giảm đáng kể.", "Bạn đánh giá guardrail metrics trong tuyển dụng."),
    ]),
  ]),
  category("lifestyle", "Lifestyle", [
    keyword("planning", "Planning", [
      scenario("life-plan-1", "Lên kế hoạch rồi không làm", "Người dùng tạo routine buổi sáng nhưng ít đánh dấu hoàn thành sau tuần đầu.", "Bạn thiết kế lifestyle habit planner."),
      scenario("life-plan-2", "Gợi ý quá chung chung", "App đề xuất hoạt động cuối tuần nhưng người dùng bỏ qua vì không khớp ngân sách, thời tiết hoặc tâm trạng.", "Bạn thiết kế personalized discovery."),
    ]),
    keyword("motivation", "Motivation", [
      scenario("life-motivate-1", "Streak gây áp lực", "Streak giúp retention tăng nhưng một nhóm người dùng báo cảm giác tội lỗi khi mất chuỗi.", "Bạn thiết kế motivation mechanic có guardrail."),
      scenario("life-motivate-2", "Mục tiêu riêng tư", "Người dùng muốn theo dõi mục tiêu cá nhân nhưng ngại nhập dữ liệu nhạy cảm vào app.", "Bạn thiết kế privacy-aware journaling."),
    ]),
  ]),
  category("medical", "Medical", [
    keyword("appointment", "Appointment", [
      scenario("med-appointment-1", "Đặt lịch xong vẫn gọi điện", "Bệnh nhân đặt lịch khám qua app nhưng vẫn gọi phòng khám để xác nhận vì lo thông tin chưa được nhận.", "Bạn thiết kế booking confirmation cho medical app."),
      scenario("med-appointment-2", "Không biết chuẩn bị gì", "Bệnh nhân bỏ lỡ giấy tờ cần mang theo, khiến check-in tại phòng khám chậm.", "Bạn thiết kế pre-visit experience."),
    ]),
    keyword("safety", "Safety & Clarity", [
      scenario("med-safety-1", "Hướng dẫn thuốc khó hiểu", "Người chăm sóc đọc hướng dẫn dùng thuốc trong app nhưng không chắc liều lượng theo thời điểm trong ngày.", "Bạn thiết kế clarity cho medical instructions."),
      scenario("med-safety-2", "Triage tự động thiếu tin cậy", "Người dùng nhập triệu chứng nhưng không hiểu vì sao app khuyến nghị mức độ khẩn cấp nhất định.", "Bạn thiết kế symptom checker có trách nhiệm."),
    ]),
  ]),
  category("music", "Music", [
    keyword("listening", "Listening to Audio", [
      scenario("music-listen-1", "Playlist bị bỏ qua", "Người dùng lưu playlist nhưng ít nghe lại vì không nhớ bối cảnh hoặc mood ban đầu.", "Bạn thiết kế playlist retention."),
      scenario("music-listen-2", "Nghe nhiều nhưng không hài lòng", "Thời gian nghe tăng nhờ autoplay, nhưng survey satisfaction giảm ở nhóm nghe podcast.", "Bạn phân tích metric trade-off cho audio app."),
    ]),
    keyword("creation", "Music Creation", [
      scenario("music-create-1", "Người mới sợ xuất bản", "Creator thu âm demo nhưng không publish vì lo chất lượng âm thanh và phản hồi tiêu cực.", "Bạn thiết kế creator onboarding."),
      scenario("music-create-2", "Collab nhạc bị kẹt", "Hai creator chia sẻ project nhưng không rõ version nào mới nhất và ai cần làm bước tiếp theo.", "Bạn thiết kế collaboration cho music tools."),
    ]),
  ]),
  category("maps-navigation", "Maps & Navigation", [
    keyword("route-choice", "Route Choice", [
      scenario("maps-route-1", "Không tin tuyến nhanh nhất", "Driver thấy tuyến đề xuất nhanh hơn nhưng vẫn đi đường quen vì sợ đường nhỏ hoặc khó rẽ.", "Bạn thiết kế navigation trust."),
      scenario("maps-route-2", "Metric nhanh nhất gây rủi ro", "Tối ưu ETA làm nhiều người chọn tuyến nhanh nhưng qua khu vực khó đậu xe, dẫn đến trải nghiệm cuối hành trình tệ.", "Bạn thiết kế routing metric có guardrail."),
    ]),
    keyword("place-discovery", "Place Discovery", [
      scenario("maps-place-1", "Review nhiều nhưng quyết định khó", "Người dùng xem nhiều review địa điểm nhưng không chọn được vì review mâu thuẫn và thiếu ngữ cảnh.", "Bạn thiết kế discovery cho maps."),
      scenario("maps-place-2", "Accessibility thiếu dữ liệu", "Người dùng xe lăn không chắc địa điểm có lối vào phù hợp vì thông tin accessibility thiếu hoặc cũ.", "Bạn thiết kế trust cho dữ liệu địa điểm."),
    ]),
  ]),
  category("news", "News", [
    keyword("trust", "Trust in Information", [
      scenario("news-trust-1", "Đọc tiêu đề nhưng không mở bài", "Người dùng lướt nhiều headline nhưng ít mở bài, sau đó hiểu sai nội dung vì chỉ đọc tóm tắt ngắn.", "Bạn thiết kế news consumption experience."),
      scenario("news-trust-2", "Nguồn tin bị nghi ngờ", "Người dùng bỏ qua đề xuất tin tức vì không rõ nguồn và lý do cá nhân hóa.", "Bạn thiết kế trust signals cho news app."),
    ]),
    keyword("overload", "Information Overload", [
      scenario("news-overload-1", "Quá nhiều breaking news", "Notification breaking news có click cao nhưng nhiều người tắt toàn bộ notification sau một tuần.", "Bạn thiết kế notification policy cho news app."),
      scenario("news-overload-2", "Tin quan trọng bị chìm", "Người dùng muốn theo dõi chủ đề dài hạn nhưng feed ưu tiên tin nóng ngắn hạn.", "Bạn thiết kế retention theo topic."),
    ]),
  ]),
  category("photo-video", "Photo & Video", [
    keyword("creation", "Adding & Creating", [
      scenario("photo-create-1", "Tạo video đầu tiên bị kẹt", "Người dùng chọn nhiều ảnh nhưng không hoàn tất video vì không hiểu template, nhạc và text sẽ ảnh hưởng thế nào.", "Bạn thiết kế creation flow cho video tool."),
      scenario("photo-create-2", "Upload lâu gây bỏ cuộc", "Creator upload video dài rồi rời app khi progress không rõ và mạng chập chờn.", "Bạn thiết kế upload resilience."),
    ]),
    keyword("editing", "Editing & Updating", [
      scenario("photo-edit-1", "Filter đẹp nhưng mất tự nhiên", "Người dùng áp filter AI nhiều hơn nhưng share rate giảm vì ảnh trông quá chỉnh sửa.", "Bạn phân tích metric trade-off cho photo editor."),
      scenario("photo-edit-2", "Không hiểu quyền riêng tư", "Người dùng đăng album gia đình nhưng không chắc ai có thể xem sau khi đổi cài đặt share.", "Bạn thiết kế privacy state cho media sharing."),
    ]),
  ]),
  category("productivity", "Productivity", [
    keyword("task-management", "Task Management", [
      scenario("prod-task-1", "Tạo task nhiều, hoàn thành ít", "Người dùng thêm nhiều task vào đầu tuần nhưng tỉ lệ hoàn thành thấp và backlog phình ra.", "Bạn thiết kế productivity workflow."),
      scenario("prod-task-2", "Chuyển từ note cũ khó", "Người dùng import note từ công cụ cũ nhưng không tìm lại được cấu trúc quen thuộc.", "Bạn thiết kế migration cho productivity app."),
    ]),
    keyword("focus", "Focus", [
      scenario("prod-focus-1", "Focus mode ít dùng", "Người dùng nói muốn tập trung nhưng hiếm khi bật focus mode vì sợ bỏ lỡ việc gấp.", "Bạn thiết kế focus feature với trust."),
      scenario("prod-focus-2", "Reminder gây mệt", "Reminder giúp mở app nhiều hơn nhưng người dùng báo cảm giác bị thúc ép và tắt thông báo.", "Bạn đánh giá engagement vs wellbeing."),
    ]),
  ]),
  category("reference", "Reference", [
    keyword("search", "Search & Lookup", [
      scenario("ref-search-1", "Tìm nhiều nhưng không chắc đúng", "Người dùng tra thuật ngữ chuyên môn và mở nhiều kết quả vì không biết nguồn nào phù hợp trình độ của họ.", "Bạn thiết kế reference search."),
      scenario("ref-search-2", "Không quay lại tài liệu đã lưu", "Người dùng bookmark nhiều mục nhưng ít dùng lại khi cần, vì nhãn và context lưu không rõ.", "Bạn thiết kế saved reference flow."),
    ]),
    keyword("learning-aid", "Learning Aid", [
      scenario("ref-learn-1", "Tóm tắt quá ngắn", "Tính năng tóm tắt giúp đọc nhanh nhưng người dùng hiểu sai khái niệm phức tạp.", "Bạn thiết kế AI summary với guardrail."),
      scenario("ref-learn-2", "Nguồn cập nhật không rõ", "Người dùng không biết nội dung tham khảo đã lỗi thời hay còn áp dụng.", "Bạn thiết kế freshness signals."),
    ]),
  ]),
  category("shopping", "Shopping", [
    keyword("checkout", "Checkout", [
      scenario("shop-checkout-1", "Bỏ giỏ vì phí cuối", "Người mua thêm sản phẩm vào giỏ nhưng rời đi khi phí ship và thuế xuất hiện ở bước cuối.", "Bạn thiết kế checkout transparency."),
      scenario("shop-checkout-2", "Conversion tăng, return tăng", "Một thay đổi giúp mua nhanh hơn nhưng tỉ lệ trả hàng tăng vì người mua bỏ qua thông tin size.", "Bạn đánh giá conversion với guardrail."),
    ]),
    keyword("trust", "Marketplace Trust", [
      scenario("shop-trust-1", "Review không đủ tin", "Người mua xem nhiều review nhưng vẫn không mua vì nghi review giả hoặc không giống nhu cầu của họ.", "Bạn thiết kế trust signals cho marketplace."),
      scenario("shop-trust-2", "Người bán mới khó có đơn", "Seller mới không có review nên ít được mua, nhưng hệ thống ranking lại ưu tiên seller đã có lịch sử.", "Bạn thiết kế marketplace cold start."),
    ]),
  ]),
  category("social-networking", "Social Networking", [
    keyword("community", "Community Participation", [
      scenario("social-community-1", "Đọc nhiều, đăng ít", "Người dùng mới vào nhóm đọc bài thường xuyên nhưng không đăng hoặc comment vì sợ bị đánh giá.", "Bạn thiết kế activation cho social community."),
      scenario("social-community-2", "Tương tác tăng nhưng toxic hơn", "Một thay đổi tăng comment và reply nhưng report về toxic behavior cũng tăng.", "Bạn thiết kế guardrail metrics cho social product."),
    ]),
    keyword("following", "Following & Subscribing", [
      scenario("social-follow-1", "Follow rồi không quay lại", "Người dùng follow nhiều creator khi onboarding nhưng ít quay lại feed sau vài ngày.", "Bạn thiết kế retention cho social feed."),
      scenario("social-follow-2", "Mute nhiều hơn unsubscribe", "Người dùng mute creator thay vì unfollow vì không muốn gây cảm giác xã hội tiêu cực.", "Bạn thiết kế controls cho social graph."),
    ]),
  ]),
  category("travel-transportation", "Travel & Transportation", [
    keyword("booking", "Booking & Reserving", [
      scenario("travel-book-1", "Đặt vé bỏ dở", "Người dùng tìm chuyến bay phù hợp nhưng bỏ ở bước chọn hành lý và điều kiện đổi vé.", "Bạn thiết kế travel checkout."),
      scenario("travel-book-2", "Giá thay đổi làm mất trust", "Người dùng quay lại đặt phòng sau vài giờ và thấy giá khác, dẫn đến nghi ngờ nền tảng.", "Bạn thiết kế pricing transparency."),
    ]),
    keyword("trip-status", "Trip Status", [
      scenario("travel-status-1", "Không biết xe đang ở đâu", "Khách đặt xe sân bay nhưng liên tục nhắn tài xế vì bản đồ cập nhật chậm và ETA thay đổi.", "Bạn thiết kế real-time trip status."),
      scenario("travel-status-2", "Delay alert gây hoang mang", "Thông báo delay gửi nhanh nhưng thiếu hướng dẫn hành động tiếp theo, làm support volume tăng.", "Bạn thiết kế disruption experience."),
    ]),
  ]),
  category("utilities", "Utilities", [
    keyword("settings", "Setting Up", [
      scenario("util-setup-1", "Cài đặt ban đầu bị bỏ", "Người dùng tải app quản lý mật khẩu nhưng không hoàn tất import và setup thiết bị thứ hai.", "Bạn thiết kế utility onboarding."),
      scenario("util-setup-2", "Bật tắt nhầm tính năng", "Người dùng bật tính năng đồng bộ nhưng không hiểu dữ liệu nào được chia sẻ giữa thiết bị.", "Bạn thiết kế settings clarity."),
    ]),
    keyword("recovery", "Error Recovery", [
      scenario("util-recovery-1", "Reset password gây lo", "Người dùng reset password nhưng không chắc phiên đăng nhập trên thiết bị khác có bị thoát không.", "Bạn thiết kế account recovery."),
      scenario("util-recovery-2", "Backup ít được kiểm tra", "Người dùng bật backup tự động nhưng chưa từng restore thử, nên không biết dữ liệu có thực sự an toàn.", "Bạn thiết kế confidence cho backup utility."),
    ]),
  ]),
];

export const categoriesPerPage = 7;
export const scenariosPerPage = 4;

export function getCategory(categoryId: string): ScenarioCategory | undefined {
  return scenarioLibrary.find((item) => item.id === categoryId);
}

export function getKeyword(
  categoryId: string,
  keywordId: string,
): ScenarioKeyword | undefined {
  return getCategory(categoryId)?.keywords.find((item) => item.id === keywordId);
}

export function getScenario(
  categoryId: string,
  keywordId: string,
  scenarioId: string,
): Scenario | undefined {
  return getKeyword(categoryId, keywordId)?.scenarios.find((item) => item.id === scenarioId);
}

export function randomItem<T>(items: readonly T[]): T {
  const item = items[Math.floor(Math.random() * items.length)];
  if (item === undefined) throw new Error("Cannot pick a random item from an empty list");
  return item;
}

export function randomScenario(categoryId?: string): {
  category: ScenarioCategory;
  keyword: ScenarioKeyword;
  scenario: Scenario;
} {
  const category = categoryId ? getCategory(categoryId) : randomItem(scenarioLibrary);
  if (!category) throw new Error("Category not found");
  const keyword = randomItem(category.keywords);
  const scenario = randomItem(keyword.scenarios);
  return { category, keyword, scenario };
}

export function topicFromScenario(args: {
  category: ScenarioCategory;
  keyword: ScenarioKeyword;
  scenario: Scenario;
}): string {
  return `[${args.category.label} / ${args.keyword.label}] ${args.scenario.title}: ${args.scenario.context} Vai trò: ${args.scenario.role}`;
}

export function allBehaviorKeywords(): string[] {
  return behaviorKeywords;
}
