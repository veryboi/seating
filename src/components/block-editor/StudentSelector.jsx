import React, { useState } from 'react';

const StudentSelector = ({ students, studentTags, value, onChange, multiple = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Debug logging
  console.log('StudentSelector props:', {
    students,
    studentTags,
    value,
    multiple
  });

  // Filter students based on search
  const filteredStudents = (students || []).filter(student => 
    student.toLowerCase().includes(search.toLowerCase())
  );

  // Get tags for a student
  const getStudentTags = (student) => studentTags[student] || [];

  const handleSelect = (student) => {
    if (multiple) {
      const newValue = value.includes(student) 
        ? value.filter(s => s !== student)
        : [...value, student];
      onChange(newValue);
    } else {
      onChange(student);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <div 
        className="border rounded-lg p-2 cursor-pointer bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {multiple ? (
          <div className="flex flex-wrap gap-1">
            {value.length > 0 ? (
              value.map(student => (
                <span 
                  key={student}
                  className="bg-gray-100 px-2 py-1 rounded text-sm"
                >
                  {student}
                </span>
              ))
            ) : (
              <span className="text-gray-400">Select students...</span>
            )}
          </div>
        ) : (
          <span>{value || 'Select a student...'}</span>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
          <input
            type="text"
            className="w-full p-2 border-b"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="p-1">
            {filteredStudents.length > 0 ? (
              filteredStudents.map(student => (
                <div
                  key={student}
                  className={`
                    p-2 hover:bg-gray-100 cursor-pointer rounded
                    ${multiple && value.includes(student) ? 'bg-blue-50' : ''}
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(student);
                  }}
                >
                  <div>{student}</div>
                  {getStudentTags(student).length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {getStudentTags(student).map(tag => (
                        <span 
                          key={tag}
                          className="bg-gray-100 px-1.5 py-0.5 rounded-full text-xs text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-2 text-gray-500 text-sm">
                No students found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSelector; 