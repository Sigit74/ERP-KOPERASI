import React from 'react';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: number | string | undefined;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
    value,
    onChange,
    className = "w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-bold",
    ...props
}) => {
    // If value is 0, show empty string to user to avoid "delete 0" annoyance
    // BUT allow "0" string if user specifically typed it (handled via parent state usually, 
    // but here we just focus on the prop presentation). 
    // Standard pattern: 0 -> "" for display if it matches the 'default' state we want to hide.
    const displayValue = value === 0 ? '' : value;

    return (
        <input
            type="number"
            value={displayValue}
            onChange={onChange}
            className={className}
            onFocus={(e) => e.target.select()} // Auto-select on focus for even easier editing
            {...props}
        />
    );
};
