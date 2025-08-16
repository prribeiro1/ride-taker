// Local storage utilities for offline-first PWA
export interface Point {
  id: string;
  name: string;
  address?: string;
  createdAt: Date;
}

export interface Child {
  id: string;
  pointId: string;
  name: string;
  responsible?: string;
  contact?: string;
  createdAt: Date;
}

export interface Attendance {
  id: string;
  childId: string;
  date: string; // YYYY-MM-DD format
  present: boolean;
  timestamp: Date;
}

const STORAGE_KEYS = {
  POINTS: 'transport_points',
  CHILDREN: 'transport_children',
  ATTENDANCE: 'transport_attendance'
} as const;

// Generic storage functions
export const getStorageData = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading from storage:', error);
    return [];
  }
};

export const setStorageData = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing to storage:', error);
  }
};

// Points management
export const getPoints = (): Point[] => getStorageData<Point>(STORAGE_KEYS.POINTS);

export const addPoint = (point: Omit<Point, 'id' | 'createdAt'>): Point => {
  const newPoint: Point = {
    ...point,
    id: crypto.randomUUID(),
    createdAt: new Date()
  };
  
  const points = getPoints();
  points.push(newPoint);
  setStorageData(STORAGE_KEYS.POINTS, points);
  
  return newPoint;
};

export const updatePoint = (id: string, updates: Partial<Point>): void => {
  const points = getPoints();
  const index = points.findIndex(p => p.id === id);
  if (index !== -1) {
    points[index] = { ...points[index], ...updates };
    setStorageData(STORAGE_KEYS.POINTS, points);
  }
};

export const deletePoint = (id: string): void => {
  const points = getPoints().filter(p => p.id !== id);
  setStorageData(STORAGE_KEYS.POINTS, points);
  
  // Also delete associated children
  const children = getChildren().filter(c => c.pointId !== id);
  setStorageData(STORAGE_KEYS.CHILDREN, children);
};

// Children management
export const getChildren = (): Child[] => getStorageData<Child>(STORAGE_KEYS.CHILDREN);

export const getChildrenByPoint = (pointId: string): Child[] => 
  getChildren().filter(child => child.pointId === pointId);

export const addChild = (child: Omit<Child, 'id' | 'createdAt'>): Child => {
  const newChild: Child = {
    ...child,
    id: crypto.randomUUID(),
    createdAt: new Date()
  };
  
  const children = getChildren();
  children.push(newChild);
  setStorageData(STORAGE_KEYS.CHILDREN, children);
  
  return newChild;
};

export const updateChild = (id: string, updates: Partial<Child>): void => {
  const children = getChildren();
  const index = children.findIndex(c => c.id === id);
  if (index !== -1) {
    children[index] = { ...children[index], ...updates };
    setStorageData(STORAGE_KEYS.CHILDREN, children);
  }
};

export const deleteChild = (id: string): void => {
  const children = getChildren().filter(c => c.id !== id);
  setStorageData(STORAGE_KEYS.CHILDREN, children);
  
  // Also delete associated attendance records
  const attendance = getAttendance().filter(a => a.childId !== id);
  setStorageData(STORAGE_KEYS.ATTENDANCE, attendance);
};

// Attendance management
export const getAttendance = (): Attendance[] => getStorageData<Attendance>(STORAGE_KEYS.ATTENDANCE);

export const getTodayAttendance = (): Attendance[] => {
  const today = new Date().toISOString().split('T')[0];
  return getAttendance().filter(a => a.date === today);
};

export const getAttendanceByChild = (childId: string): Attendance[] =>
  getAttendance().filter(a => a.childId === childId);

export const markAttendance = (childId: string, present: boolean): void => {
  const today = new Date().toISOString().split('T')[0];
  const attendance = getAttendance();
  
  // Remove existing attendance for today if any
  const filtered = attendance.filter(a => !(a.childId === childId && a.date === today));
  
  // Add new attendance record
  const newAttendance: Attendance = {
    id: crypto.randomUUID(),
    childId,
    date: today,
    present,
    timestamp: new Date()
  };
  
  filtered.push(newAttendance);
  setStorageData(STORAGE_KEYS.ATTENDANCE, filtered);
};

// Monthly report data
export const getMonthlyReport = (year: number, month: number) => {
  const children = getChildren();
  const attendance = getAttendance();
  
  const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
  const monthlyAttendance = attendance.filter(a => a.date.startsWith(monthStr));
  
  return children.map(child => {
    const childAttendance = monthlyAttendance.filter(a => a.childId === child.id);
    const present = childAttendance.filter(a => a.present).length;
    const absent = childAttendance.filter(a => !a.present).length;
    
    return {
      child,
      present,
      absent,
      total: present + absent
    };
  });
};