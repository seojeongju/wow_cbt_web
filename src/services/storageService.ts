export const StorageService = {
    /**
     * 파일을 R2 스토리지에 업로드하고 접근 가능한 URL을 반환합니다.
     */
    uploadFile: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/storage/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '업로드 실패');
            }

            const data = await response.json();
            return data.url; // 예: /api/storage/file/uploads/123.png
        } catch (error) {
            console.error('Storage Upload Error:', error);
            throw error;
        }
    }
};
