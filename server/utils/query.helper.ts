/**
 * Creates a MongoDB query object for keyword searching across multiple fields.
 * @param keyword The search term. If undefined or empty, returns an empty object.
 * @param searchFields An array of field names to search within (e.g., ['name', 'email']).
 * @returns A MongoDB query object with an $or condition, or an empty object.
 */
export const createKeywordSearchFilter = (
  keyword: string | undefined,
  searchFields: string[]
) => {
  // If no keyword is provided, return an empty filter
  if (!keyword) {
    return {};
  }

  // Create a case-insensitive regular expression
  const keywordRegex = { $regex: keyword, $options: "i" };

  // Build an array of conditions for the $or operator
  const orConditions = searchFields.map((field) => ({
    [field]: keywordRegex,
  }));

  // Return the final query object
  return { $or: orConditions };
};
