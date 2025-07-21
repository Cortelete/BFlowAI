import React, { useState, useEffect } from 'react';
import type { EditableText as EditableTextType } from '../types';

const STORAGE_KEY = 'beautyflow_editable_texts';

// Helper functions to interact with localStorage for editable texts.
const getTexts = (): EditableTextType => {
    const texts = localStorage.getItem(STORAGE_KEY);
    return texts ? JSON.parse(texts) : {};
};

const saveText = (key: string, value: string) => {
    const texts = getTexts();
    texts[key] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(texts));
};


interface EditableTextProps {
    textKey: string;
    defaultValue: string;
    isBoss: boolean;
    className?: string;
}

export const EditableText: React.FC<EditableTextProps> = ({ textKey, defaultValue, isBoss, className }) => {
    const [text, setText] = useState(defaultValue);

    // Load the custom text from storage when the component mounts.
    useEffect(() => {
        const storedTexts = getTexts();
        if (storedTexts[textKey]) {
            setText(storedTexts[textKey]);
        } else {
            setText(defaultValue);
        }
    }, [textKey, defaultValue]);

    const handleEdit = () => {
        // Use a simple browser prompt to get the new text.
        const newText = prompt(`Editar texto para "${textKey}":`, text);
        if (newText !== null && newText.trim() !== '') {
            setText(newText);
            saveText(textKey, newText);
        }
    };

    return (
        <span className={`relative group inline-flex items-center ${className}`}>
            {text}
            {isBoss && (
                <button 
                    onClick={handleEdit} 
                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-brand-gold-500"
                    aria-label={`Editar texto ${textKey}`}
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                </button>
            )}
        </span>
    );
};
