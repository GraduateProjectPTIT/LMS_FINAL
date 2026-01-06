import React from 'react';

interface CertificateProps {
    studentName: string;
    courseName: string;
    tutorName: string;
    date: string;
}

const Certificate: React.FC<CertificateProps> = ({ studentName, courseName, tutorName, date }) => {
    return (
        <div className="w-full flex items-center justify-center bg-[#fdfbf7] p-2 md:p-4 rounded-lg border border-gray-200">
             <div className="relative w-full aspect-[1.414/1] border-[5px] md:border-[10px] lg:border-[20px] border-[#4A90A4] bg-white p-4 md:p-8 lg:p-10 text-center flex flex-col items-center shadow-xl">
                <style>
                    {`
                        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
                    `}
                </style>
                <div className="text-[10px] md:text-xs text-gray-400 mb-2 md:mb-5 tracking-widest uppercase">Glow Academy</div>
                
                <h1 className="text-3xl md:text-5xl text-[#2c3e50] uppercase mb-2 tracking-[4px]" style={{ fontFamily: "'Playfair Display', serif" }}>Certificate</h1>
                <h2 className="text-lg md:text-2xl text-[#4A90A4] uppercase font-light tracking-[2px] mt-0" style={{ fontFamily: "'Playfair Display', serif" }}>of Completion</h2>

                <p className="text-sm md:text-xl text-[#555] italic my-2 md:my-5" style={{ fontFamily: "'Playfair Display', serif" }}>This certificate is proudly presented to</p>
                <div className="student-name text-4xl md:text-[60px] lg:text-[80px] text-[#2c3e50] my-2 border-b border-gray-200 pb-2 md:pb-5 w-4/5 mx-auto leading-none" style={{ fontFamily: "'Great Vibes', cursive" }}>
                    {studentName}
                </div>

                <p className="text-sm md:text-xl text-[#555] italic my-2 md:my-5" style={{ fontFamily: "'Playfair Display', serif" }}>For the successful completion of the professional makeup course:</p>
                <div className="course-name text-xl md:text-3xl lg:text-4xl font-bold text-[#2c3e50] uppercase my-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {courseName}
                </div>

                <div className="flex justify-between w-full md:w-4/5 mt-auto pt-5 md:pt-10 pb-2 md:pb-5 mx-auto px-4">
                    <div className="flex flex-col items-center">
                        <div className="text-xl md:text-3xl text-[#2c3e50] min-h-[30px] md:min-h-[40px]" style={{ fontFamily: "'Great Vibes', cursive" }}>{date}</div>
                        <div className="w-24 md:w-48 border-b border-gray-500 mb-1"></div>
                        <div className="text-[10px] md:text-sm uppercase text-gray-500 font-sans tracking-widest">Date</div>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="text-xl md:text-3xl text-[#2c3e50] min-h-[30px] md:min-h-[40px]" style={{ fontFamily: "'Great Vibes', cursive" }}>{tutorName}</div>
                         <div className="w-24 md:w-48 border-b border-gray-500 mb-1"></div>
                        <div className="text-[10px] md:text-sm uppercase text-gray-500 font-sans tracking-widest">Master Instructor</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Certificate;
