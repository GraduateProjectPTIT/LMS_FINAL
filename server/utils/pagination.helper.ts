// src/utils/pagination.helper.ts

import { Model, FilterQuery } from "mongoose";

// These interfaces are the same as before
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export interface PaginationParams {
  page?: string;
  limit?: string;
}

export interface UserQueryParams extends PaginationParams {
  role?: "student" | "tutor";
  keyword?: string;
  isVerified?: string;
  isSurveyCompleted?: string;
}

/**
 * A reusable function to paginate Mongoose queries.
 * @param model - The Mongoose model to paginate.
 * @param params - The query parameters for page and limit.
 * @param filter - Optional Mongoose filter query object (the 'where' clause).
 */
export async function paginate<T>(
  model: Model<T>,
  params: PaginationParams,
  filter: FilterQuery<T> = {}
): Promise<PaginatedResult<T>> {
  // 1. Sanitize and get page and limit values with defaults
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;
  const skip = (page - 1) * limit;

  // 2. Execute queries in parallel using Mongoose methods
  const [data, totalItems] = await Promise.all([
    model
      .find(filter) // Pass the filter here
      .sort({ createdAt: -1 }) // Optional: add a default sort
      .skip(skip)
      .limit(limit)
      .exec(),
    model.countDocuments(filter).exec(), // Pass the same filter to get an accurate count
  ]);

  // 3. Calculate total pages
  const totalPages = Math.ceil(totalItems / limit);

  // 4. Return the structured paginated result
  return {
    data,
    meta: {
      totalItems,
      totalPages,
      currentPage: page,
      pageSize: limit,
    },
  };
}
