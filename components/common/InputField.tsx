import React from 'react';

const InputField = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
    <div>
        <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">{label}</label>
        <input {...props} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-transparent focus:ring-2 focus:ring-brand-pink-500" />
    </div>
);

export default InputField;
