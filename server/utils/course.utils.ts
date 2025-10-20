import mongoose from "mongoose";
import CategoryModel from "../models/category.model";
import { ECourseLevel } from "../constants/course-level.enum";

export function parseCourseLevel(val?: any): ECourseLevel {
  const s = String(val ?? "").trim().toLowerCase();
  if (s === ECourseLevel.Beginner.toLowerCase()) return ECourseLevel.Beginner;
  if (s === ECourseLevel.Intermediate.toLowerCase()) return ECourseLevel.Intermediate;
  if (s === ECourseLevel.Advanced.toLowerCase()) return ECourseLevel.Advanced;
  if (s === ECourseLevel.Professional.toLowerCase()) return ECourseLevel.Professional;
  throw new Error("Invalid course level");
}

export function normalizeTitleArray(arr?: any[]) {
  if (!Array.isArray(arr)) return [];
  return arr.map((it: any) => ({ ...(it && it._id ? { _id: it._id } : {}), title: it?.title }));
}

export function normalizeCourseSections(sections?: any[]) {
  if (!Array.isArray(sections)) return [];
  return sections.map((section: any) => ({
    ...(section && section._id ? { _id: section._id } : {}),
    sectionTitle: section?.sectionTitle,
    sectionContents: Array.isArray(section?.sectionContents)
      ? section.sectionContents.map((lecture: any) => ({
          ...(lecture && lecture._id ? { _id: lecture._id } : {}),
          videoTitle: lecture?.videoTitle,
          videoDescription: lecture?.videoDescription,
          video: lecture?.video,
          videoLength: lecture?.videoLength,
          videoLinks: Array.isArray(lecture?.videoLinks)
            ? lecture.videoLinks.map((vl: any) => ({
                ...(vl && vl._id ? { _id: vl._id } : {}),
                title: vl?.title,
                url: vl?.url,
              }))
            : [],
        }))
      : [],
  }));
}

export function assertSectionVideosHavePublicIdUrl(sections?: any[]) {
  if (!Array.isArray(sections)) return;
  for (const section of sections) {
    if (!Array.isArray(section?.sectionContents)) continue;
    for (const lecture of section.sectionContents) {
      if (!lecture?.video?.public_id || !lecture?.video?.url) {
        const err = new Error(
          "Each lecture must include video { public_id, url } (upload via client with signature)"
        );
        (err as any).statusCode = 400;
        throw err;
      }
    }
  }
}

export async function validateAndMaterializeCategoryIds(ids: string[]) {
  if (!Array.isArray(ids) || ids.length === 0) {
    const err = new Error("categories must be a non-empty array of Category ids");
    (err as any).statusCode = 400;
    throw err;
  }
  if (!ids.every((id) => typeof id === "string" && mongoose.Types.ObjectId.isValid(id))) {
    const err = new Error("One or more category ids are invalid");
    (err as any).statusCode = 400;
    throw err;
  }
  const found = await CategoryModel.find({ _id: { $in: ids } }).select("_id");
  if (found.length !== ids.length) {
    const err = new Error("One or more categories do not exist");
    (err as any).statusCode = 400;
    throw err;
  }
  return ids.map((id) => new mongoose.Types.ObjectId(id));
}

export function summarizeCourseData(courseData?: any[]) {
  const totalLectures = Array.isArray(courseData)
    ? courseData.reduce(
        (acc: number, sec: any) => acc + (Array.isArray(sec.sectionContents) ? sec.sectionContents.length : 0),
        0
      )
    : 0;
  const totalSeconds = Array.isArray(courseData)
    ? courseData.reduce(
        (acc: number, sec: any) =>
          acc +
          (Array.isArray(sec.sectionContents)
            ? sec.sectionContents.reduce((a: number, lec: any) => a + (lec?.videoLength || 0), 0)
            : 0),
        0
      )
    : 0;
  return { totalLectures, totalDuration: totalSeconds };
}

export function sanitizeCourseMedia(course: any) {
  if (!course) return course;
  const clone = { ...(course.toObject ? course.toObject() : course) };
  if (clone.thumbnail) clone.thumbnail = { url: clone.thumbnail?.url };
  if (clone.creatorId?.avatar) clone.creatorId.avatar = { url: clone.creatorId.avatar?.url };
  if (Array.isArray(clone.courseData)) {
    clone.courseData = clone.courseData.map((sec: any) => ({
      ...sec,
      sectionContents: Array.isArray(sec.sectionContents)
        ? sec.sectionContents.map((lec: any) => ({
            ...lec,
            video: lec?.video ? { url: lec.video.url } : undefined,
          }))
        : [],
    }));
  }
  return clone;
}
