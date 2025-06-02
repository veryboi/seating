export function shuffle(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function buildEmptySeatMap(desks) {
  const seatMap = {};
  desks.forEach((_, dIdx) => {
    desks[dIdx].seats.forEach((_, sIdx) => {
      seatMap[`desk-${dIdx}/seat-${sIdx}`] = null;
    });
  });
  return seatMap;
}

export function findSeatOfStudent(seatMap, studentId) {
  return Object.entries(seatMap).find(([_, student]) => student === studentId)?.[0];
}

export function generateSeatMapFromList(studentList, desks) {
  const seatMap = buildEmptySeatMap(desks);
  const totalSeats = Object.keys(seatMap).length;
  const students = shuffle(studentList).slice(0, totalSeats);
  
  Object.keys(seatMap).forEach((seatId, idx) => {
    if (idx < students.length) {
      seatMap[seatId] = students[idx];
    }
  });
  
  return seatMap;
} 