import { useCallback } from 'react';
import type { ItemStatus } from '../hooks/useLotteryData';

interface StatusOption {
    status: NonNullable<ItemStatus>;
    label: string;
    activeBg: string;
}

const OPTIONS: StatusOption[] = [
    {
        status: 'dateli',
        label: 'Dateli',
        activeBg: 'bg-blue-500 text-white shadow-md shadow-blue-500/30',
    },
    {
        status: 'dataudio',
        label: 'Dataudio',
        activeBg: 'bg-green-500 text-white shadow-md shadow-green-500/30',
    },
    {
        status: 'perla',
        label: 'Perla',
        activeBg: 'bg-pink-500 text-white shadow-md shadow-pink-500/30',
    },
];

interface StatusToggleProps {
    value: ItemStatus;
    onChange: (status: ItemStatus) => void;
}

export function StatusToggle({ value, onChange }: StatusToggleProps) {
    const handleClick = useCallback(
        (status: NonNullable<ItemStatus>) => {
            onChange(value === status ? null : status);
        },
        [value, onChange],
    );

    return (
        <div role="radiogroup" aria-label="Estado del dato" className="flex gap-1 md:grid md:grid-cols-3 md:w-full">
            {OPTIONS.map(({ status, label, activeBg }) => {
                const isActive = value === status;

                return (
                    <button
                        key={status}
                        role="radio"
                        type="button"
                        aria-checked={isActive}
                        aria-label={label}
                        onClick={() => handleClick(status)}
                        className={`
                            flex items-center justify-center
                            px-2 py-1 md:py-0 md:min-h-[44px] rounded-md md:rounded-lg
                            text-[8px] md:text-[10px] font-bold uppercase tracking-wider
                            border transition-all duration-150 ease-out
                            active:scale-95 select-none
                            outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-1
                            ${isActive
                                ? `${activeBg} border-transparent`
                                : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'
                            }
                        `}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
