
export const formatPhoneNumber = (value: string | undefined | null) => {
    if (!value) return '';
    const clean = value.replace(/[^\d]/g, '');

    // 02 (Seoul) special case
    if (clean.startsWith('02')) {
        if (clean.length < 3) return clean;
        if (clean.length < 6) return `${clean.slice(0, 2)}-${clean.slice(2)}`;
        if (clean.length < 10) return `${clean.slice(0, 2)}-${clean.slice(2, 5)}-${clean.slice(5)}`;
        return `${clean.slice(0, 2)}-${clean.slice(2, 6)}-${clean.slice(6, 10)}`;
    }

    // Mobile / Other Area Codes (010, 031, etc.)
    if (clean.length < 4) return clean;
    if (clean.length < 8) return `${clean.slice(0, 3)}-${clean.slice(3)}`;

    // For when the user is typing 10 digits (010-123-4567) or needs 11 digits (010-1234-5678)
    // While typing the 10th char of an 11-char number, it might look like 3-3-4
    // But if it's a full 11 chars, it's 3-4-4.
    if (clean.length < 11) {
        return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
    }

    // 11 digits standard (010-1234-5678)
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 11)}`;
};
