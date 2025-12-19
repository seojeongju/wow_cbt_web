export interface Question {
    id: string;
    category: string; // e.g., '3D형상모델링', '3D프린터설정'
    text: string;
    imageUrl?: string | null; // Optional image for diagrams/drawings (null for deleted images)
    options: string[];
    optionImages?: (string | null)[]; // Optional images for each option (null for deleted images)
    correctAnswer: number | string; // 0-3 index or string answer
    explanation: string;
}

export interface Exam {
    id: string;
    title: string;
    courseName?: string;
    courseId?: string;
    subjectName?: string;
    subjectId?: string;
    topic?: string; // 소분류 (챕터, 주제 등)
    round?: string; // 차시
    description?: string;
    timeLimit: number; // in minutes
    passScore?: number;
    questions: Question[];
    questionsCount?: number;
}

export interface UserAnswer {
    questionId: string;
    selectedOption: number | string | null; // null if not answered
    isCorrect: boolean;
}

export interface Category {
    id: string;
    name: string;
}

export interface Course {
    id: string;
    name: string;
    details?: string; // JSON string containing { description, targets, features, howToUse }
    category?: string;
}

export interface CourseEnrollment {
    courseId?: string; // Often we only have name, but sometimes ID
    courseName: string;
    enrolledAt: string;
    status: 'pending' | 'active' | 'rejected' | 'expired' | 'approved';
    expiresAt?: string;
}

export interface User {
    id: string;
    email: string;
    password?: string;
    name: string;
    phone: string;
    role: 'student' | 'admin';
    courseEnrollments: CourseEnrollment[];
    createdAt: string;
    lastLoginAt?: string;
    approved?: boolean;
    pendingCourses?: any[];
    debug?: any; // For debugging purposes
}

export interface ExamResult {
    id: string;
    userId: string;
    examId: string;
    examTitle?: string;
    courseName?: string;
    score: number;
    totalQuestions: number;
    wrongCount: number;
    date: string; // ISO string
    passed: boolean;
    answers?: { [key: string]: number | string }; // Optional for history detail
    status?: 'completed';
}

export interface WrongProblem {
    id: string; // Unique ID (timestamp_questionId)
    examId: string;
    question: Question;
    wrongAnswer: number | string | null;
    date: string;
}

export interface Inquiry {
    id: string;
    userId?: string;
    userName: string;
    category: string; // 'ERROR', 'QUESTION', 'OTHER' or custom string
    title: string;
    content: string;
    status: 'PENDING' | 'RESOLVED';
    createdAt: string;
    answer?: string; // Admin reply
    answeredAt?: string;
    userEmail?: string;
}
