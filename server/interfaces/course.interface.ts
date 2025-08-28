export interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}

export interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}

export interface IAddReviewData {
  review: string;
  rating: number;
}

export interface IAddReviewReplyData {
  comment: string;
  courseId: string;
  reviewId: string;
}
