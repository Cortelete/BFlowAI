import React from 'react';

const CheckboxField = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input type="checkbox" {...props} className="h-4 w-4 rounded text-brand-pink-500 focus:ring-brand-pink-500 border-gray-300" />
        {label}
    </label>
);

export default CheckboxField;
