export function exportStudents(studentList, studentTags, studentNotes, customTags) {
  const data = {
    students: studentList,
    tags: studentTags,
    notes: studentNotes,
    customTags,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "students.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function importStudents(data) {
  if (!data || !Array.isArray(data.students)) {
    throw new Error("Invalid student data format");
  }
  return {
    studentList: data.students,
    studentTags: data.tags || {},
    studentNotes: data.notes || {},
    customTags: data.customTags || [],
  };
} 