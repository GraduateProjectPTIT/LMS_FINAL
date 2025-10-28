"use client"

import React, { useState, useEffect } from 'react'

interface LectureQuestionsProps {
    courseId: string;
    contentId: string;
}

const LectureQuestions = ({ courseId, contentId }: LectureQuestionsProps) => {

    const [questions, setQuestions] = useState([]);


    return (
        <div>LectureQuestions</div>
    )
}

export default LectureQuestions