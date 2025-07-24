export const getAvatarColor = (name: string) => {
    const colors = ['bg-brand-pink-500', 'bg-brand-purple-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500'];
    if (!name) return colors[0];
    const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
};
