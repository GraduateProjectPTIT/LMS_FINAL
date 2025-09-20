export const LIMITS = {
    SECTION_TITLE: { min: 5, max: 100 },
    LECTURE_TITLE: { min: 5, max: 150 },
    LECTURE_DESCRIPTION: { min: 20, max: 1000 },
    RESOURCE_TITLE: { min: 3, max: 100 },
    RESOURCE_URL: { min: 10, max: 500 },
    VIDEO_LENGTH: { min: 0.1, max: 1440 } // 0.1 phút đến 24 giờ
};


export const formatError = (sectionIdx: number, lectureIdx?: number, linkIdx?: number, message?: string) => {
    let base = `Section ${sectionIdx + 1}`;
    if (typeof lectureIdx === "number") base += `, Lecture ${lectureIdx + 1}`;
    if (typeof linkIdx === "number") base += `, Resource ${linkIdx + 1}`;
    return `${base}: ${message}`;
}
