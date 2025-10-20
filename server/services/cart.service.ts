import mongoose from "mongoose";
import CartModel from "../models/cart.model";
import CourseModel from "../models/course.model";
import ErrorHandler from "../utils/ErrorHandler";
import EnrolledCourseModel from "../models/enrolledCourse.model";

const mapCourseToCartItem = (course: any) => {
  const totalSections = Array.isArray(course.courseData)
    ? course.courseData.length
    : 0;
  const totalLectures = Array.isArray(course.courseData)
    ? course.courseData.reduce(
      (acc: number, sec: any) =>
        acc +
        (Array.isArray(sec.sectionContents) ? sec.sectionContents.length : 0),
      0
    )
    : 0;
  const totalTimeSeconds = Array.isArray(course.courseData)
    ? course.courseData.reduce(
      (acc: number, sec: any) =>
        acc +
        (Array.isArray(sec.sectionContents)
          ? sec.sectionContents.reduce(
            (a: number, lec: any) => a + (lec?.videoLength || 0),
            0
          )
          : 0),
      0
    )
    : 0;

  return {
    _id: String(course._id),
    name: course.name,
    price: course.price,
    estimatedPrice: course.estimatedPrice,
    thumbnail: { url: course.thumbnail?.url },
    level: course.level,
    totalSections,
    totalLectures,
    totalTime: totalTimeSeconds,
    instructorName: (course as any).creatorId?.name,
    ratings: course.ratings,
  };
};

export const getOrCreateCart = async (userId: string) => {
  let cart = await CartModel.findOne({ userId });
  if (!cart) {
    cart = await CartModel.create({ userId, items: [], savedForLater: [] });
  }
  return cart;
};

export const getCartService = async (userId: string, next: any) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ErrorHandler("Invalid user id", 400);
  }
  const cart = await getOrCreateCart(userId);
  const courseIds = [
    ...new Set([
      ...cart.items.map((i) => String(i.courseId)),
      ...cart.savedForLater.map((i) => String(i.courseId)),
    ]),
  ];
  const courses = await CourseModel.find({ _id: { $in: courseIds } })
    .select(
      "_id name price estimatedPrice thumbnail level ratings courseData creatorId"
    )
    .populate("creatorId", "name");

  const courseMap = new Map<string, any>();
  courses.forEach((c) => courseMap.set(String(c._id), c));

  const items = cart.items
    .map((i) => courseMap.get(String(i.courseId)))
    .filter(Boolean)
    .map(mapCourseToCartItem);
  const savedForLater = cart.savedForLater
    .map((i) => courseMap.get(String(i.courseId)))
    .filter(Boolean)
    .map(mapCourseToCartItem);

  const totalItems = items.length;
  const totalPrice = items.reduce(
    (acc: number, it: any) => acc + (it.price || 0),
    0
  );

  return {
    items,
    savedForLater,
    totalItems,
    totalPrice,
  };
};

export const addToCartService = async (
  userId: string,
  courseId: string
): Promise<{ cart: any; added: boolean }> => {
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(courseId)
  ) {
    throw new ErrorHandler("Invalid id", 400);
  }
  const course = await CourseModel.findById(courseId).select("_id");
  if (!course) throw new ErrorHandler("Course not found", 404);

  const alreadyPurchased = await EnrolledCourseModel.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    courseId: new mongoose.Types.ObjectId(courseId),
  }).select("_id");
  if (alreadyPurchased) {
    const existingCart = await getOrCreateCart(userId);
    existingCart.items = existingCart.items.filter(
      (i) => String(i.courseId) !== String(courseId)
    ) as any;
    await existingCart.save();
    throw new ErrorHandler("You have already purchased this course", 400);
  }

  const cart = await getOrCreateCart(userId);

  const inCart = cart.items.some(
    (i) => String(i.courseId) === String(courseId)
  );
  if (!inCart) {
    cart.items.push({ courseId: new mongoose.Types.ObjectId(courseId) } as any);
  }
  cart.savedForLater = cart.savedForLater.filter(
    (i) => String(i.courseId) !== String(courseId)
  ) as any;

  await cart.save();
  return { cart, added: !inCart };
};

export const removeFromCartService = async (
  userId: string,
  courseId: string
) => {
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(courseId)
  ) {
    throw new ErrorHandler("Invalid id", 400);
  }
  const cart = await getOrCreateCart(userId);
  const before = cart.items.length;
  cart.items = cart.items.filter(
    (i) => String(i.courseId) !== String(courseId)
  ) as any;
  await cart.save();
  if (before === cart.items.length) {
  }
  return cart;
};

export const moveToSavedForLaterService = async (
  userId: string,
  courseId: string
) => {
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(courseId)
  ) {
    throw new ErrorHandler("Invalid id", 400);
  }
  const cart = await getOrCreateCart(userId);
  const existedInSaved = cart.savedForLater.some(
    (i) => String(i.courseId) === String(courseId)
  );
  if (!existedInSaved) {
    cart.savedForLater.push({
      courseId: new mongoose.Types.ObjectId(courseId),
    } as any);
  }
  cart.items = cart.items.filter(
    (i) => String(i.courseId) !== String(courseId)
  ) as any;
  await cart.save();
  return cart;
};

export const moveToCartFromSavedService = async (
  userId: string,
  courseId: string
) => {
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(courseId)
  ) {
    throw new ErrorHandler("Invalid id", 400);
  }
  const cart = await getOrCreateCart(userId);
  const inCart = cart.items.some(
    (i) => String(i.courseId) === String(courseId)
  );
  if (!inCart) {
    cart.items.push({ courseId: new mongoose.Types.ObjectId(courseId) } as any);
  }
  cart.savedForLater = cart.savedForLater.filter(
    (i) => String(i.courseId) !== String(courseId)
  ) as any;
  await cart.save();
  return cart;
};

export const clearCartService = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ErrorHandler("Invalid user id", 400);
  }
  const cart = await getOrCreateCart(userId);
  cart.items = [] as any;
  await cart.save();
  return cart;
};
