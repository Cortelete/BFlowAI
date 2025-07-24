import React from 'react';
import { Icon } from '../common/Icon';

interface StatCardProps {
    title: string;
    value: string;
    icon: string;
    color: string;
    description: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, description }) => (
    <div className={`bg-opacity-20 backdrop-blur-lg border border-opacity-30 p-6 rounded-2xl shadow-lg flex items-center justify-between transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${color}`}>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-4xl font-bold font-serif">{value}</p>
        <p className="text-sm opacity-80 mt-1">{description}</p>
      </div>
      <div className="text-5xl opacity-70">
          <Icon icon={icon} />
      </div>
    </div>
);

export default StatCard;
