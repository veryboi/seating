import React from 'react';

const generateRuleSummary = (type, rule) => {
  console.log('Generating summary for:', { type, rule });
  
  if (!rule || typeof rule !== 'object') return '';

  try {
    switch (type) {
      case 'balanceRules':
      case 'balance':
        if (!rule.tags) return 'Balance rule';
        return `Balance ${rule.tags.join(', ')} ${rule.scope || 'room'}-wide`;
      
      case 'groups':
      case 'group': {
        const students = rule.students || [];
        const tags = rule.tags || [];
        const entities = [...students, ...tags];
        if (entities.length === 0) return 'Group rule';
        
        const relationText = rule.relation === 'apart' ? 
          `apart (min dist: ${rule.minDistance || 1})` : 
          `together (cluster: ${rule.clusterSize || 2})`;
        
        return `Keep ${entities.join(', ')} ${relationText}`;
      }
      
      case 'preferences':
      case 'preference': {
        const locations = [];
        if (rule.deskIds) {
          locations.push(...rule.deskIds.map(id => `desk ${id.split('-')[1]}`));
        }
        if (rule.seatIds) {
          locations.push(...rule.seatIds.map(id => {
            const [desk, seat] = id.split('/');
            return `seat ${seat.split('-')[1]} of desk ${desk.split('-')[1]}`;
          }));
        }
        if (locations.length === 0) return 'Preference rule';
        
        return `${rule.student || 'Any'} prefers ${locations.join(', ')} (weight: ${rule.weight || 1})`;
      }
      
      case 'global': {
        const parts = [];
        if (rule.maxSameTagPerRow) {
          parts.push(`Max ${rule.maxSameTagPerRow} same tag per row`);
        }
        if (rule.optimizeFor) {
          parts.push(`optimize for ${rule.optimizeFor}`);
        }
        return parts.length > 0 ? parts.join(', ') : 'Global rule';
      }
      
      case 'ordering': {
        if (!rule.type) return 'Ordering rule';
        
        if (rule.type === 'alphabetic') {
          return `Sort by ${rule.by || 'first'} name ${rule.direction || 'asc'}ending`;
        } else if (rule.type === 'random') {
          return 'Random order';
        } else if (rule.type === 'custom' && rule.order) {
          return `Custom order: ${rule.order.join(' → ')}`;
        }
        return 'Ordering rule';
      }
      
      default:
        return `${type} rule`;
    }
  } catch (err) {
    console.error('Error generating summary:', err);
    return `${type} rule`;
  }
};

const DraggableBlock = ({ type, rule, children, onRemove, isDragging }) => {
  const blockColors = {
    balance: 'bg-blue-100 border-blue-300',
    group: 'bg-green-100 border-green-300',
    groups: 'bg-green-100 border-green-300',
    preference: 'bg-purple-100 border-purple-300',
    preferences: 'bg-purple-100 border-purple-300',
    global: 'bg-orange-100 border-orange-300',
    ordering: 'bg-yellow-100 border-yellow-300'
  };

  const summary = generateRuleSummary(type, rule);

  // Normalize type for display
  const displayType = type === 'preferences' ? 'Preference' : 
                     type === 'groups' ? 'Group' : 
                     type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div 
      className={`
        ${blockColors[type] || 'bg-gray-100 border-gray-300'}
        p-4 rounded-lg border-2 mb-3
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        transition-all duration-200
        hover:shadow-md
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="space-y-1">
          <span className="font-semibold capitalize">{displayType} Rule</span>
          {summary && summary !== `${type} rule` && (
            <div className="text-sm text-gray-600">{summary}</div>
          )}
        </div>
        <button 
          onClick={onRemove}
          className="text-gray-500 hover:text-red-500 transition-colors"
        >
          ×
        </button>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
};

export default DraggableBlock; 