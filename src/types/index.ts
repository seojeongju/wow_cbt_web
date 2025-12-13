export interface Question {
    id: string;
    category: string; // e.g., '3D형상모델링', '3D프린터설정'
    text: string;
    imageUrl?: string; // Optional image for diagrams/drawings
    options: string[];
    correctAnswer: number; // 0-3 index
    explanation: string;
}

export interface Exam {
    id: string;
    title: string;
    timeLimit: number; // in minutes
    questions: Question[];
}

export interface UserAnswer {
    questionId: string;
    selectedOption: number | null; // null if not answered
    isCorrect: boolean;
}
