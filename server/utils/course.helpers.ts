import { ECourseLevel } from "../constants/course-level.enum";

export const normalizeLevel = (lv: any): ECourseLevel => {
  const s = String(lv || "").trim().toLowerCase();
  if (s === ECourseLevel.Beginner.toLowerCase()) return ECourseLevel.Beginner;
  if (s === ECourseLevel.Intermediate.toLowerCase()) return ECourseLevel.Intermediate;
  if (s === ECourseLevel.Advanced.toLowerCase()) return ECourseLevel.Advanced;
  if (s === ECourseLevel.Professional.toLowerCase()) return ECourseLevel.Professional;
  if (s === ECourseLevel.All.toLowerCase()) return ECourseLevel.All;
  return ECourseLevel.All;
};

export const formatTime = (minutes: number): string => {
  const mins = Number(minutes) || 0;
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0 ? `${hours}h` : `${hours}h ${rem}m`;
};
