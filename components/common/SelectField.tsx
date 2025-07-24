import React from 'react';

const SelectField = ({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, children: React.ReactNode }) => (
    <div>
        <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">{label}</label>
        <select {...props} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-transparent focus:ring-2 focus:ring-brand-pink-500 appearance-none">
            {children}
        </select>
    </div>
);

export default SelectField;
