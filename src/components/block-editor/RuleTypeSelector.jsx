import React from 'react';

const RuleTypeSelector = ({ onSelect }) => {
  const ruleTypes = [
    {
      type: 'balanceRules',
      label: 'Balance Rule',
      description: 'Balance student attributes across desks, rows, or room'
    },
    {
      type: 'groups',
      label: 'Group Rule',
      description: 'Keep students together or apart'
    },
    {
      type: 'preferences',
      label: 'Preference Rule',
      description: 'Set seating preferences for students'
    },
    {
      type: 'global',
      label: 'Global Rule',
      description: 'Set room-wide settings'
    },
    {
      type: 'ordering',
      label: 'Ordering Rule',
      description: 'Control student queue order'
    }
  ];

  return (
    <div className="flex gap-2 mb-4 flex-wrap">
      {ruleTypes.map(({ type, label, description }) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className={`
            px-3 py-2 rounded-lg text-sm
            transition-colors duration-200
            hover:opacity-80
            ${type === 'balanceRules' && 'bg-blue-100 text-blue-800'}
            ${type === 'groups' && 'bg-green-100 text-green-800'}
            ${type === 'preferences' && 'bg-purple-100 text-purple-800'}
            ${type === 'global' && 'bg-orange-100 text-orange-800'}
            ${type === 'ordering' && 'bg-yellow-100 text-yellow-800'}
          `}
          title={description}
        >
          + {label}
        </button>
      ))}
    </div>
  );
};

export default RuleTypeSelector; 