
export const OpenAIService = {
    // 텍스트를 AI에게 보내서 구조화된 문제 데이터로 변환
    parseQuestionsWithAI: async (rawText: string, apiKey: string): Promise<any[]> => {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini", // 빠르고 저렴한 모델 사용
                    messages: [
                        {
                            role: "system",
                            content: `You are an expert exam question extractor and tutor.
                            The user will provide text extracted from a PDF. It may have broken lines, mixed layouts, or weird spacing.
                            
                            Your task:
                            1. Identify individual questions and their options (1,2,3,4 or ①,②,③,④).
                            2. Correct broken text and spacing to make questions readable.
                            3. ⭐️ CRITICAL: Carefully identify the correct answer. Look for these indicators:
                               - Answers marked with ✓, ●, ■, ★, or similar symbols
                               - Text like "정답:", "Answer:", "답:", "해답:" followed by a number
                               - Bold or underlined text in the options
                               - Numbers in parentheses like (1), (2) near question numbers
                               - Any explicit answer keys in the text
                               - If the answer is clearly stated, use it. If uncertain, analyze the question and try to solve it logically.
                               - If you absolutely cannot determine the answer, set correctAnswer to -1 (but try your best first!)
                            4. ⭐️ Generate a helpful, educational EXPLANATION for why the correct answer is right (in Korean, polite tone).
                            
                            Return ONLY a valid JSON array. Do not include markdown formatting or code blocks.
                            
                            JSON Format:
                            [
                                {
                                    "text": "Question text...",
                                    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                                    "correctAnswer": 0, // 0-based index (0,1,2,3), or -1 if unknown
                                    "explanation": "해설: ~때문에 이것이 정답입니다. (AI 생성)" 
                                }
                            ]
                            
                            Ignore headers, footers, or page numbers.`
                        },
                        {
                            role: "user",
                            content: rawText
                        }
                    ],
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error?.message || 'AI 요청 실패');
            }

            const data = await response.json();
            const content = data.choices[0].message.content.trim();

            // Remove markdown code blocks if present
            // Regex to extract JSON block
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);

            let jsonString = '';
            if (jsonMatch && jsonMatch[1]) {
                jsonString = jsonMatch[1].trim();
            } else {
                // Fallback: try to find array brackets if entire content isn't wrapped
                const arrayMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
                if (arrayMatch) {
                    jsonString = arrayMatch[0];
                } else {
                    jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
                }
            }

            return JSON.parse(jsonString);

        } catch (error) {
            console.error('OpenAI Parsing Error:', error);
            throw error;
        }
    },

    // ⭐️ 유사 문제 생성 기능 (과정 컨텍스트 포함)
    generateSimilarQuestions: async (
        originalQuestion: { text: string; options: string[]; correctAnswer: number; explanation?: string; category?: string },
        apiKey: string,
        count: number = 3,
        courseName?: string,
        examTitle?: string
    ): Promise<any[]> => {
        try {
            // 과정/시험 컨텍스트 문자열 생성
            const contextInfo = courseName
                ? `\n\n⚠️ 중요: 이 문제는 "${courseName}" 자격증 시험을 위한 것입니다.${examTitle ? ` (${examTitle})` : ''}
생성하는 모든 문제는 반드시 "${courseName}" 과정의 범위와 주제에 맞아야 합니다.
관련 없는 주제나 다른 분야의 문제를 생성하지 마세요.`
                : '';

            const categoryInfo = originalQuestion.category
                ? `\n카테고리/영역: ${originalQuestion.category}`
                : '';

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: `You are an expert exam question creator for Korean professional certification exams.
${courseName ? `You are creating questions specifically for the "${courseName}" certification exam.` : ''}
                            
Your task: Given an original question, create ${count} NEW similar questions that:
1. Test the SAME concept/topic but with different scenarios or wording
2. Maintain the SAME difficulty level
3. Have 4 options each (one correct, three plausible distractors)
4. Are completely original (not just rephrased)
5. Include a Korean explanation for WHY the answer is correct
6. ⚠️ MUST stay within the scope of "${courseName || '해당 자격증'}" certification exam
7. Use appropriate Korean technical terminology for this field

Return ONLY a valid JSON array. Do not include markdown formatting.

JSON Format:
[
    {
        "text": "새로운 문제 내용...",
        "options": ["선택지 1", "선택지 2", "선택지 3", "선택지 4"],
        "correctAnswer": 0,
        "explanation": "해설: 이 문제의 정답은 ~입니다. ~이기 때문입니다. (AI 생성)"
    }
]`
                        },
                        {
                            role: "user",
                            content: `다음 원본 문제를 바탕으로 ${count}개의 유사한 문제를 생성해주세요:
${contextInfo}
${categoryInfo}

문제: ${originalQuestion.text}

선택지:
1. ${originalQuestion.options[0]}
2. ${originalQuestion.options[1]}
3. ${originalQuestion.options[2]}
4. ${originalQuestion.options[3]}

정답: ${originalQuestion.correctAnswer + 1}번 (${originalQuestion.options[originalQuestion.correctAnswer]})

${originalQuestion.explanation ? `해설: ${originalQuestion.explanation}` : ''}`
                        }
                    ],
                    temperature: 0.7 // 더 창의적인 결과를 위해 높은 temperature
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error?.message || 'AI 요청 실패');
            }

            const data = await response.json();
            const content = data.choices[0].message.content.trim();

            // Remove markdown code blocks if present
            // Regex to extract JSON block
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);

            let jsonString = '';
            if (jsonMatch && jsonMatch[1]) {
                jsonString = jsonMatch[1].trim();
            } else {
                const arrayMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
                if (arrayMatch) {
                    jsonString = arrayMatch[0];
                } else {
                    jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
                }
            }

            return JSON.parse(jsonString);

        } catch (error) {
            console.error('OpenAI Generate Similar Questions Error:', error);
            throw error;
        }
    }
};
