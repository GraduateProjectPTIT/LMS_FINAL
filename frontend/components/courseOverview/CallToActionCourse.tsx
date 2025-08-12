import { Award, Clock, Shield } from 'lucide-react'
import React from 'react'

const CallToActionCourse = () => {
    return (
        <>
            <div className="flex flex-col md:flex-row items-center justify-between md:mt-12 py-4 md:py-10">
                <div className="md:w-7/12 mb-8 md:mb-0">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Start Your Learning Journey?</h2>
                    <p className="text-white/90 text-lg mb-6 max-w-2xl">
                        Join thousands of students who have already taken this course and transformed their skills.
                        Our 30-day money-back guarantee ensures you can try with confidence.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <button className="bg-white hover:bg-gray-50 hover:cursor-pointer hover:opacity-70 text-indigo-600 font-bold py-3 px-8 rounded-lg transition-colors shadow-lg hover:shadow-xl">
                            Enroll Now
                        </button>
                    </div>
                </div>
                <div className="md:w-5/12 flex justify-center">
                    <div className="bg-gray-200/20 dark:bg-white/20 backdrop-blur-sm p-6 rounded-2xl text-gray-600 dark:text-white shadow-xl">
                        <div className="flex items-center gap-4 mb-4">
                            <Clock className="" size={24} />
                            <div>
                                <h3 className="font-medium">Limited Time Offer</h3>
                                <p className="text-sm">Special pricing ends soon</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                            <Shield className="" size={24} />
                            <div>
                                <h3 className="font-medium">30-Day Money Back</h3>
                                <p className="text-sm">No questions asked</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Award className="" size={24} />
                            <div>
                                <h3 className="font-medium">Certificate Included</h3>
                                <p className="text-sm">Earn upon completion</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default CallToActionCourse