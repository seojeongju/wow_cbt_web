import { Exam } from '../types';

export const MOCK_EXAM_1: Exam = {
    id: 'exam-001',
    title: '제1회 3D프린터운용기능사 실전 모의고사',
    timeLimit: 60,
    questions: [
        {
            id: 'q1',
            category: '3D형상모델링',
            text: '다음 중 3D 모델링 방식에서 서피스(Surface) 모델링의 특징으로 옳은 것은?',
            options: [
                '내부가 채워진 솔리드 형태이다.',
                '두께가 없는 면의 집합으로 표현된다.',
                '복잡한 유기적 형상 표현이 불가능하다.',
                '질량, 부피 등의 물리적 특성을 자동 계산한다.'
            ],
            correctAnswer: 1, // Index 1 is correct
            explanation: '서피스 모델링은 두께가 없는 면들의 집합으로 형상을 표현하는 방식으로, 복잡한 곡면 표현에 유리하지만 질량이나 부피 정보는 포함하지 않습니다.'
        },
        {
            id: 'q2',
            category: '3D프린팅설정',
            text: 'FDM(FFF) 방식 3D 프린터에서 출력물의 바닥 안착력을 높이기 위한 설정(Build Plate Adhesion) 종류가 아닌 것은?',
            options: [
                'Skirt (스커트)',
                'Brim (브림)',
                'Raft (라프트)',
                'Infill (내부채움)'
            ],
            correctAnswer: 3,
            explanation: 'Infill(내부채움)은 출력물 내부를 채우는 밀도 및 패턴 설정이며, 바닥 안착(Adhesion)과는 직접적인 관련이 적습니다. 바닥 안착 종류에는 Skirt, Brim, Raft가 있습니다.'
        },
        {
            id: 'q3',
            category: '3D프린터운용',
            text: '출력 도중 노즐이 막히는 현상의 원인으로 거리가 먼 것은?',
            options: [
                '노즐 온도가 너무 낮을 때',
                '필라멘트에 이물질이 묻어 있을 때',
                '베드 레벨링이 너무 낮게(노즐과 베드가 너무 가깝게) 설정되었을 때',
                '출력 속도가 매우 느릴 때'
            ],
            correctAnswer: 3,
            explanation: '출력 속도가 느린 것 자체는 노즐 막힘의 주된 원인이 아닙니다. 오히려 속도가 너무 빠르면 압출 불량이 발생할 수 있습니다. 노즐 온도가 낮거나, 이물질, 또는 노즐과 베드가 너무 가까워 압출이 안 될 때 막힘이 발생합니다.'
        },
        {
            id: 'q4',
            category: '3D프린팅안전',
            text: 'FDM 3D 프린터 사용 시 발생하는 유해물질(Vocs, 초미세먼지) 예방 수칙으로 부적절한 것은?',
            options: [
                '출력 중에는 환기 장치를 가동하거나 창문을 연다.',
                '출력이 끝난 후 바로 문을 열어 확인한다.',
                '밀폐된 챔버가 있더라도 주기적으로 환기한다.',
                '친환경 소재(PLA 등)를 사용하더라도 환기에 유의한다.'
            ],
            correctAnswer: 1,
            explanation: '출력이 끝난 직후에는 챔버 내부에 유해물질 농도가 높을 수 있으므로, 충분히 환기가 된 후에 문을 열거나 마스크를 착용하고 접근하는 것이 좋습니다.'
        },
        {
            id: 'q5',
            category: '엔지니어링모델링',
            text: '다음 그림과 같은 3D 도면을 보고, 화살표 방향에서의 정투상도로 가장 적절한 것은?',
            imageUrl: 'https://placehold.co/600x400/png?text=3D+Model+View', // Placeholder image
            options: [
                '정면도 A',
                '정면도 B',
                '정면도 C',
                '정면도 D'
            ],
            correctAnswer: 0,
            explanation: '화살표 방향에서 바라본 형상은 "L"자 모양의 하단 블록 위에 원통이 얹혀진 형태이므로 정면도 A가 가장 적절합니다.'
        }
    ]
};
