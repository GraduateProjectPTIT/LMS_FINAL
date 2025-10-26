export interface IAddCommentData {
  comment: string;
  courseId: string;
  contentId: string;
}

export interface IAddReplyData {
  reply: string;
  courseId: string;
  contentId: string;
  commentId: string;
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
