import React from 'react';
import { Icon } from '../common/Icon';

interface KpiCardProps {
    title: string;
    value: string;
    icon: string;
    color: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, color }) => (
    <div className={`bg-opacity-20 backdrop-blur-lg border border-opacity-30 p-5 rounded-2xl shadow-lg flex items-center justify-between transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${color}`}>
      <div>
          <p className="text-sm font-semibold uppercase opacity-80">{title}</p>
          <p className="text-3xl font-bold font-serif">{value}</p>
      </div>
      <div className="text-4xl opacity-50">
          <Icon icon={icon} />
      </div>
    </div>
);

export default KpiCard;
