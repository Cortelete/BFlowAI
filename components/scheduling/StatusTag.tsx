import React from 'react';
import type { Appointment } from '../../types';

interface StatusTagProps {
    status: Appointment['status'];
}

const StatusTag: React.FC<StatusTagProps> = ({ status }) => {
    const statusStyles = {
        Pago: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
        Pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300',
        Atrasado: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[status]}`}>{status}</span>;
};

export default StatusTag;
