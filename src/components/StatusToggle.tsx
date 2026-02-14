import { useCallback } from 'react';
import type { ItemStatus } from '../types/lottery';
import { cn } from '../utils/cn';

interface StatusOption {
    status: NonNullable<ItemStatus>;
    label: string;
    activeBg: string;
}

const OPTIONS: StatusOption[] = [
    {
        status: 'dateli',
        label: 'Dateli',
        activeBg: 'bg-blue-500/20 text-blue-300 shadow-md shadow-blue-500/10 border-blue-500/30',
    },
    {
        status: 'dataudio',
        label: 'Dataudio',
        activeBg: 'bg-emerald-500/20 text-emerald-300 shadow-md shadow-emerald-500/10 border-emerald-500/30',
    },
    {
        status: 'perla',
        label: 'Perla',
        activeBg: 'bg-pink-500/20 text-pink-300 shadow-md shadow-pink-500/10 border-pink-500/30',
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
                        className={cn(
                            'flex items-center justify-center',
                            'px-2 py-1 md:py-0 md:min-h-8 rounded-md md:rounded-lg',
                            'text-[8px] md:text-[10px] font-bold uppercase tracking-wider',
                            'border transition-all duration-150 ease-out',
                            'active:scale-95 select-none',
                            'outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-1',
                            isActive
                                ? activeBg
                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-300',
                        )}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
