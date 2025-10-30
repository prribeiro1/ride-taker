// Local storage utilities for offline-first PWA
export interface Route {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface Point {
  id: string;
  routeId: string;
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
  ROUTES: 'transport_routes',
  POINTS: 'transport_points',
  CHILDREN: 'transport_children',
  ATTENDANCE: 'transport_attendance'
} as const;

// Generic storage functions with date handling
export const getStorageData = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects for Routes, Points and Children
    if (key === STORAGE_KEYS.ROUTES || key === STORAGE_KEYS.POINTS || key === STORAGE_KEYS.CHILDREN) {
      return parsed.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt)
      }));
    }
    // Convert date strings back to Date objects for Attendance
    if (key === STORAGE_KEYS.ATTENDANCE) {
      return parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
    }
    return parsed;
  } catch (error) {
    console.error('Error reading from storage:', error);
    return [];
  }
};

export const setStorageData = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`Saved ${data.length} items to ${key}`);
  } catch (error) {
    console.error('Error writing to storage:', error);
  }
};

// Routes management
export const getRoutes = (): Route[] => getStorageData<Route>(STORAGE_KEYS.ROUTES);

export const addRoute = (route: Omit<Route, 'id' | 'createdAt'>): Route => {
  const newRoute: Route = {
    ...route,
    id: crypto.randomUUID(),
    createdAt: new Date()
  };
  
  const routes = getRoutes();
  routes.push(newRoute);
  setStorageData(STORAGE_KEYS.ROUTES, routes);
  
  return newRoute;
};

export const updateRoute = (id: string, updates: Partial<Route>): void => {
  const routes = getRoutes();
  const index = routes.findIndex(r => r.id === id);
  if (index !== -1) {
    routes[index] = { ...routes[index], ...updates };
    setStorageData(STORAGE_KEYS.ROUTES, routes);
  }
};

export const deleteRoute = (id: string): void => {
  const routes = getRoutes().filter(r => r.id !== id);
  setStorageData(STORAGE_KEYS.ROUTES, routes);
  
  // Also delete points and children associated with this route
  const pointIds = getPoints().filter(p => p.routeId === id).map(p => p.id);
  const points = getPoints().filter(p => p.routeId !== id);
  setStorageData(STORAGE_KEYS.POINTS, points);
  const children = getChildren().filter(c => !pointIds.includes(c.pointId));
  setStorageData(STORAGE_KEYS.CHILDREN, children);
};

// Points management
export const getPoints = (): Point[] => getStorageData<Point>(STORAGE_KEYS.POINTS);

export const getPointsByRoute = (routeId: string): Point[] => 
  getPoints().filter(p => p.routeId === routeId);

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

export const addMultiplePoints = (pointsData: Omit<Point, 'id' | 'createdAt'>[]): Point[] => {
  const newPoints: Point[] = pointsData.map(point => ({
    ...point,
    id: crypto.randomUUID(),
    createdAt: new Date()
  }));
  
  const points = getPoints();
  points.push(...newPoints);
  setStorageData(STORAGE_KEYS.POINTS, points);
  
  return newPoints;
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

export const addMultipleChildren = (childrenData: Omit<Child, 'id' | 'createdAt'>[]): Child[] => {
  const newChildren: Child[] = childrenData.map(child => ({
    ...child,
    id: crypto.randomUUID(),
    createdAt: new Date()
  }));
  
  const children = getChildren();
  children.push(...newChildren);
  setStorageData(STORAGE_KEYS.CHILDREN, children);
  
  return newChildren;
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
  
  // Debug log for checking attendance saving
  console.log(`Attendance marked for child ${childId} on ${today}: ${present ? 'present' : 'absent'}`);
  console.log('Current attendance records:', filtered.filter(a => a.childId === childId));
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