import mongoose from "mongoose";
import userModel from "../models/user.model";
import CourseModel from "../models/course.model";
import OrderModel from "../models/order.model";
import EnrolledCourseModel from "../models/enrolledCourse.model";
import CartModel from "../models/cart.model";

class PaypalRepository {
  async findUserById(userId: string) {
    return await userModel.findById(userId);
  }

  async findCoursesByIds(ids: string[]) {
    return await CourseModel.find({ _id: { $in: ids } });
  }

  async findExistingEnrollments(userId: string, courseIds: string[]) {
    return await EnrolledCourseModel.find({
      userId,
      courseId: { $in: courseIds },
    }).select("courseId");
  }

  async findOrderByToken(token: string) {
    return await OrderModel.findOne({
      "payment_info.order_token": token,
      payment_method: "paypal",
    });
  }

  async updateOrderUser(orderId: string, userId: string) {
    return await OrderModel.updateOne(
      { _id: orderId },
      { $set: { userId: new mongoose.Types.ObjectId(userId) } }
    );
  }

  async findOrderById(orderId: string) {
    return await OrderModel.findById(orderId).lean();
  }

  async upsertOrder(filter: any, updateData: any) {
    return await OrderModel.findOneAndUpdate(filter, updateData, {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    });
  }

  async removeItemsFromCart(userId: string, courseIds: string[]) {
    const objectIds = courseIds.map((id) => new mongoose.Types.ObjectId(id));
    return await CartModel.updateOne(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $pull: { items: { courseId: { $in: objectIds } } } }
    );
  }

  async markNotificationSent(orderId: string) {
    return await OrderModel.findOneAndUpdate(
      { _id: orderId, notificationSent: { $ne: true } },
      { $set: { notificationSent: true } },
      { new: true }
    );
  }

  async markEmailSent(orderId: string) {
    return await OrderModel.findOneAndUpdate(
      { _id: orderId, emailSent: { $ne: true } },
      { $set: { emailSent: true } },
      { new: true }
    );
  }

  async checkEnrollmentExists(userId: string, courseId: string) {
    return await EnrolledCourseModel.findOne({ userId, courseId });
  }

  async createEnrollment(userId: string, courseId: string) {
    return await EnrolledCourseModel.create({ userId, courseId });
  }

  async incrementCoursePurchasedCount(courseId: string) {
    return await CourseModel.updateOne(
      { _id: courseId },
      { $inc: { purchased: 1 } }
    );
  }

  async findOrderByPaymentId(paymentId: string) {
    return await OrderModel.findOne({
      "payment_info.id": paymentId,
      payment_method: "paypal",
    });
  }
}

export default new PaypalRepository();
