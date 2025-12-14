
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
                            1. Identify individual questions, options (1,2,3,4).
                            2. Correct broken text and spacing.
                            3. Identify or Infer the correct answer if marked (often bolded or checked). If not marked, try to solve it or set to -1.
                            4. ⭐️ IMPORTANT: Generate a helpful, educational EXPLANATION for why the correct answer is right. (Write in Korean, polite tone).
                            
                            Return ONLY a valid JSON array. Do not include markdown formatting.
                            
                            JSON Format:
                            [
                                {
                                    "text": "Question text...",
                                    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                                    "correctAnswer": 0, // 0-based index
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
            const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();

            return JSON.parse(cleanJson);

        } catch (error) {
            console.error('OpenAI Parsing Error:', error);
            throw error;
        }
    }
};
