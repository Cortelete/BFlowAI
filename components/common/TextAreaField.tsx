import React from 'react';

const TextAreaField = ({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) => (
    <div>
        <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">{label}</label>
        <textarea {...props} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-transparent focus:ring-2 focus:ring-brand-pink-500" />
    </div>
);

export default TextAreaField;
