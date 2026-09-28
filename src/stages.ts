import { type Stage, stages } from "./types";

export const stageLabels: Record<Stage, string> = {
  frame: "Frame",
  research: "Research",
  synthesize: "Synthesize",
  ideate: "Ideate",
  prioritize: "Prioritize",
  validate: "Validate",
};

export const stageIcons: Record<Stage, string> = {
  frame: "🧭",
  research: "🔎",
  synthesize: "🧩",
  ideate: "💡",
  prioritize: "⚖️",
  validate: "✅",
};

export function stageDisplayName(stage: Stage): string {
  return `${stageIcons[stage]} ${stageLabels[stage]}`;
}

export const stageGoals: Record<Stage, string> = {
  frame:
    "Xác định ai gặp vấn đề, trong bối cảnh nào, và vấn đề ảnh hưởng ra sao.",
  research:
    "Nhận diện điều chưa biết, giả định rủi ro, và cách tìm bằng chứng.",
  synthesize:
    "Tách dữ kiện, quan sát, suy luận; rút ra insight có cơ sở.",
  ideate:
    "Mở ra nhiều hướng giải quyết khác nhau trước khi chọn một hướng.",
  prioritize:
    "Làm rõ lý do chọn hướng, trade-off, rủi ro và tiêu chí ưu tiên.",
  validate:
    "Thiết kế cách kiểm tra giải pháp và xác định kết quả có ý nghĩa.",
};

export function nextStage(stage: Stage): Stage | null {
  const index = stages.indexOf(stage);
  return stages[index + 1] ?? null;
}

export function previousStage(stage: Stage): Stage | null {
  const index = stages.indexOf(stage);
  return stages[index - 1] ?? null;
}

export function isStage(value: string): value is Stage {
  return (stages as readonly string[]).includes(value);
}

export function formatStagePath(current: Stage): string {
  return stages
    .map((stage) => {
      const label = stageDisplayName(stage);
      return stage === current ? `*${label}*` : label;
    })
    .join(" → ");
}
