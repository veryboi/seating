import React, { useState, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import DraggableBlock from './DraggableBlock';
import RuleTypeSelector from './RuleTypeSelector';
import StudentSelector from './StudentSelector';
import SeatSelector from './SeatSelector';
import { isCDL } from '../../lib/cdl.validate';

// Ensure we have valid arrays for students and tags
const ensureArray = (value) => Array.isArray(value) ? value : [];
const ensureObject = (value) => typeof value === 'object' && value !== null ? value : {};

// Rule type components
const BalanceRuleContent = ({ rule, onChange, studentTags }) => {
  // Get unique tags from studentTags
  const allTags = [...new Set(Object.values(studentTags || {}).flat())].filter(Boolean);
  
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm mb-1">Tags to Balance</label>
        <StudentSelector
          value={ensureArray(rule.tags)}
          onChange={tags => onChange({ ...rule, tags })}
          multiple={true}
          students={allTags}
          studentTags={{}}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Scope</label>
          <select 
            value={rule.scope || 'room'} 
            onChange={e => onChange({ ...rule, scope: e.target.value })}
            className="w-full border rounded p-1"
          >
            <option value="desk">Desk</option>
            <option value="row">Row</option>
            <option value="room">Room</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Mode</label>
          <select 
            value={rule.mode || 'even'} 
            onChange={e => onChange({ ...rule, mode: e.target.value })}
            className="w-full border rounded p-1"
          >
            <option value="even">Even</option>
            <option value="max">Maximum</option>
            <option value="min">Minimum</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const GroupRuleContent = ({ rule, onChange, students, studentTags }) => {
  // Get unique tags from studentTags
  const allTags = [...new Set(Object.values(studentTags || {}).flat())].filter(Boolean);
  
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm mb-1">Students</label>
        <StudentSelector
          value={ensureArray(rule.students)}
          onChange={students => onChange({ ...rule, students })}
          multiple={true}
          students={ensureArray(students)}
          studentTags={ensureObject(studentTags)}
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Tags</label>
        <StudentSelector
          value={ensureArray(rule.tags)}
          onChange={tags => onChange({ ...rule, tags })}
          multiple={true}
          students={allTags}
          studentTags={{}}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Relation</label>
          <select 
            value={rule.relation || 'together'} 
            onChange={e => onChange({ ...rule, relation: e.target.value })}
            className="w-full border rounded p-1"
          >
            <option value="together">Together</option>
            <option value="apart">Apart</option>
          </select>
        </div>
        {rule.relation === 'apart' ? (
          <div>
            <label className="block text-sm mb-1">Min Distance</label>
            <input
              type="number"
              value={rule.minDistance || 1}
              onChange={e => onChange({ ...rule, minDistance: parseInt(e.target.value) })}
              className="w-full border rounded p-1"
              min={1}
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm mb-1">Cluster Size</label>
            <input
              type="number"
              value={rule.clusterSize || 2}
              onChange={e => onChange({ ...rule, clusterSize: parseInt(e.target.value) })}
              className="w-full border rounded p-1"
              min={2}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const PreferenceRuleContent = ({ rule, onChange, students, studentTags, desks }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm mb-1">Student</label>
        <StudentSelector
          value={rule.student || ''}
          onChange={student => onChange({ ...rule, student })}
          students={['Any', ...ensureArray(students)]}
          studentTags={ensureObject(studentTags)}
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Weight</label>
        <input
          type="number"
          value={rule.weight || 1}
          onChange={e => onChange({ ...rule, weight: parseInt(e.target.value) })}
          className="w-full border rounded p-1"
          min={1}
        />
      </div>
    </div>
    <div>
      <label className="block text-sm mb-1">Location</label>
      <SeatSelector
        desks={ensureArray(desks)}
        value={{ 
          deskIds: ensureArray(rule.deskIds), 
          seatIds: rule.seatIds || [] 
        }}
        onChange={({ deskIds, seatIds }) => {
          // Only include seatIds if there are any
          const newRule = { 
            ...rule, 
            deskIds,
            ...(seatIds.length > 0 ? { seatIds } : {})
          };
          onChange(newRule);
        }}
      />
    </div>
  </div>
);

const GlobalRuleContent = ({ rule, onChange }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm mb-1">Max Same Tag Per Row</label>
        <input
          type="number"
          value={rule.maxSameTagPerRow || 1}
          onChange={e => onChange({ ...rule, maxSameTagPerRow: parseInt(e.target.value) })}
          className="w-full border rounded p-1"
          min={1}
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Optimize For</label>
        <select 
          value={rule.optimizeFor || 'visibility'} 
          onChange={e => onChange({ ...rule, optimizeFor: e.target.value })}
          className="w-full border rounded p-1"
        >
          <option value="visibility">Visibility</option>
          <option value="collaboration">Collaboration</option>
          <option value="random">Random</option>
        </select>
      </div>
    </div>
  </div>
);

const OrderingRuleContent = ({ rule, onChange, students }) => (
  <div className="space-y-3">
    <div>
      <label className="block text-sm mb-1">Type</label>
      <select 
        value={rule.type || 'alphabetic'} 
        onChange={e => {
          const type = e.target.value;
          if (type === 'alphabetic') {
            onChange({ type, by: 'first' });
          } else if (type === 'random') {
            onChange({ type });
          } else {
            onChange({ type, order: [] });
          }
        }}
        className="w-full border rounded p-1"
      >
        <option value="alphabetic">Alphabetic</option>
        <option value="random">Random</option>
        <option value="custom">Custom</option>
      </select>
    </div>

    {rule.type === 'alphabetic' && (
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">By</label>
          <select 
            value={rule.by || 'first'} 
            onChange={e => onChange({ ...rule, by: e.target.value })}
            className="w-full border rounded p-1"
          >
            <option value="first">First Name</option>
            <option value="last">Last Name</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Direction</label>
          <select 
            value={rule.direction || 'asc'} 
            onChange={e => onChange({ ...rule, direction: e.target.value })}
            className="w-full border rounded p-1"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>
    )}

    {rule.type === 'custom' && (
      <div>
        <label className="block text-sm mb-1">Custom Order</label>
        <StudentSelector
          value={rule.order || []}
          onChange={order => onChange({ ...rule, order })}
          multiple={true}
          students={students}
          studentTags={{}}
        />
      </div>
    )}
  </div>
);

const DraggableRule = ({ id, rule, type, index, moveRule, onRemove, onChange, students, studentTags, desks }) => {
  // Add debug logging
  console.log('DraggableRule props:', { id, type, rule });

  const [{ isDragging }, drag] = useDrag({
    type: 'RULE',
    item: { id, index },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'RULE',
    hover: (item, monitor) => {
      if (!drag) return;
      if (item.index === index) return;
      moveRule(item.index, index);
      item.index = index;
    },
  });

  const renderContent = () => {
    switch (type) {
      case 'balanceRules':
        return <BalanceRuleContent rule={rule} onChange={onChange} studentTags={studentTags} />;
      case 'groups':
        return <GroupRuleContent rule={rule} onChange={onChange} students={students} studentTags={studentTags} />;
      case 'preferences':
        return <PreferenceRuleContent rule={rule} onChange={onChange} students={students} studentTags={studentTags} desks={desks} />;
      case 'global':
        return <GlobalRuleContent rule={rule} onChange={onChange} />;
      case 'ordering':
        return <OrderingRuleContent rule={rule} onChange={onChange} students={students} />;
      default:
        return null;
    }
  };

  return (
    <div ref={node => drag(drop(node))}>
      <DraggableBlock 
        type={type} 
        rule={rule} 
        onRemove={onRemove} 
        isDragging={isDragging}
      >
        {renderContent()}
      </DraggableBlock>
    </div>
  );
};

const BlockEditor = ({ value, onChange, students = [], studentTags = {}, desks = [] }) => {
  const [rules, setRules] = useState(() => {
    try {
      console.log('Parsing CDL value:', value);
      const parsed = JSON.parse(value);
      console.log('Parsed CDL:', parsed);
      const result = Object.entries(parsed).flatMap(([type, rules]) => {
        console.log('Processing type:', type, 'rules:', rules);
        // Handle both array and single object cases
        if (Array.isArray(rules)) {
          return rules.map(rule => {
            console.log('Creating array rule:', { type, rule });
            return { type, rule };
          });
        } else if ((type === 'global' || type === 'ordering') && typeof rules === 'object') {
          console.log('Creating single rule:', { type, rule: rules });
          return [{ type, rule: rules }];
        }
        console.log('Skipping invalid rule type:', type);
        return [];
      });
      console.log('Final processed rules:', result);
      return result;
    } catch (err) {
      console.error('Error parsing CDL:', err);
      return [];
    }
  });

  const moveRule = useCallback((dragIndex, hoverIndex) => {
    const dragRule = rules[dragIndex];
    const newRules = [...rules];
    newRules.splice(dragIndex, 1);
    newRules.splice(hoverIndex, 0, dragRule);
    setRules(newRules);
  }, [rules]);

  // Update parent when rules change
  React.useEffect(() => {
    try {
      const cdl = rules.reduce((acc, { type, rule }) => {
        // Skip empty or invalid rules
        if (!rule || Object.keys(rule).length === 0) return acc;
        
        // Handle preferences consistently
        if (type === 'preference' || type === 'preferences') {
          if (!acc.preferences) {
            acc.preferences = [rule];
          } else {
            acc.preferences.push(rule);
          }
          return acc;
        }
        
        // Convert 'groups' type to match schema
        if (type === 'group' || type === 'groups') {
          if (!acc.groups) {
            acc.groups = [rule];
          } else {
            acc.groups.push(rule);
          }
          return acc;
        }

        // Handle balance rules consistently
        if (type === 'balance' || type === 'balanceRules') {
          if (!acc.balanceRules) {
            acc.balanceRules = [rule];
          } else {
            acc.balanceRules.push(rule);
          }
          return acc;
        }
        
        if (!acc[type]) {
          acc[type] = type === 'global' || type === 'ordering' ? rule : [rule];
        } else if (type !== 'global' && type !== 'ordering') {
          acc[type].push(rule);
        }
        return acc;
      }, {});

      // Always update parent - validation happens in CDLEditorModal
      onChange(JSON.stringify(cdl, null, 2));
    } catch (err) {
      console.error('Error generating CDL:', err);
    }
  }, [rules, onChange]);

  const handleAddRule = (type) => {
    let initialRule = {};
    
    // Initialize with required fields based on type
    switch (type) {
      case 'balanceRules':
        initialRule = {
          tags: [],
          scope: 'room',
          mode: 'even'
        };
        break;
        
      case 'groups':
        initialRule = {
          students: [],
          tags: [],
          relation: 'together',
          clusterSize: 2
        };
        break;
        
      case 'preferences':
        initialRule = {
          student: 'Any',
          weight: 1,
          deskIds: []
          // Don't initialize seatIds - only add if needed
        };
        break;
        
      case 'global':
        initialRule = {
          maxSameTagPerRow: 1,
          optimizeFor: 'visibility'
        };
        break;
        
      case 'ordering':
        initialRule = {
          type: 'alphabetic',
          by: 'first',
          direction: 'asc'
        };
        break;
    }
    
    const newRule = { type, rule: initialRule };
    setRules([...rules, newRule]);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="pt-4">
        <RuleTypeSelector onSelect={handleAddRule} />
        <div className="space-y-4">
          {rules.map((ruleData, index) => {
            console.log('Rendering rule:', ruleData);
            return (
              <DraggableRule
                key={index}
                id={index}
                index={index}
                type={ruleData.type}
                rule={ruleData.rule}
                moveRule={moveRule}
                onRemove={() => {
                  const newRules = [...rules];
                  newRules.splice(index, 1);
                  setRules(newRules);
                }}
                onChange={(newRule) => {
                  const newRules = [...rules];
                  newRules[index] = { ...newRules[index], rule: newRule };
                  setRules(newRules);
                }}
                students={students}
                studentTags={studentTags}
                desks={desks}
              />
            );
          })}
        </div>
      </div>
    </DndProvider>
  );
};

export default BlockEditor; 