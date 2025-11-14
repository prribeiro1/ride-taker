import { supabase } from '@/integrations/supabase/client';
import type { Route, Point, Child, Attendance } from './storage';

// Types for sync queue
export interface SyncOperation {
  id: string;
  type: 'insert' | 'update' | 'delete';
  table: 'routes' | 'points' | 'children' | 'attendance';
  data: any;
  localId: string;
  timestamp: number;
  retries: number;
}

const SYNC_QUEUE_KEY = 'transport_sync_queue';
const LAST_SYNC_KEY = 'transport_last_sync';
const MAX_RETRIES = 3;

// Get sync queue
export const getSyncQueue = (): SyncOperation[] => {
  try {
    const data = localStorage.getItem(SYNC_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading sync queue:', error);
    return [];
  }
};

// Add operation to sync queue
export const addToSyncQueue = (operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retries'>): void => {
  const queue = getSyncQueue();
  const newOperation: SyncOperation = {
    ...operation,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    retries: 0
  };
  queue.push(newOperation);
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  console.log('Added to sync queue:', newOperation);
};

// Remove operation from queue
const removeFromQueue = (operationId: string): void => {
  const queue = getSyncQueue().filter(op => op.id !== operationId);
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
};

// Update operation retry count
const incrementRetry = (operationId: string): void => {
  const queue = getSyncQueue();
  const operation = queue.find(op => op.id === operationId);
  if (operation) {
    operation.retries += 1;
    if (operation.retries >= MAX_RETRIES) {
      console.error('Max retries reached for operation:', operation);
      removeFromQueue(operationId);
    } else {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    }
  }
};

// Map local IDs to server IDs
const ID_MAP_KEY = 'transport_id_map';
const getIdMap = (): Record<string, string> => {
  try {
    const data = localStorage.getItem(ID_MAP_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

const setIdMap = (localId: string, serverId: string): void => {
  const map = getIdMap();
  map[localId] = serverId;
  localStorage.setItem(ID_MAP_KEY, JSON.stringify(map));
};

// Process a single sync operation
const processSyncOperation = async (operation: SyncOperation, userId: string): Promise<boolean> => {
  try {
    const idMap = getIdMap();
    let data = { ...operation.data };

    // Replace local IDs with server IDs
    if (data.id && idMap[data.id]) {
      data.id = idMap[data.id];
    }
    if (data.routeId && idMap[data.routeId]) {
      data.route_id = idMap[data.routeId];
    }
    if (data.pointId && idMap[data.pointId]) {
      data.point_id = idMap[data.pointId];
    }
    if (data.childId && idMap[data.childId]) {
      data.child_id = idMap[data.childId];
    }

    // Add user_id
    data.user_id = userId;

    // Convert camelCase to snake_case for Supabase
    const snakeCaseData: any = {
      user_id: userId
    };

    if (data.name) snakeCaseData.name = data.name;
    if (data.route_id) snakeCaseData.route_id = data.route_id;
    if (data.point_id) snakeCaseData.point_id = data.point_id;
    if (data.child_id) snakeCaseData.child_id = data.child_id;
    if (data.date) snakeCaseData.date = data.date;
    if (data.present !== undefined) snakeCaseData.status = data.present ? 'present' : 'absent';

    console.log('Processing operation:', operation.type, operation.table, snakeCaseData);

    switch (operation.type) {
      case 'insert': {
        const { data: inserted, error } = await supabase
          .from(operation.table)
          .insert(snakeCaseData)
          .select()
          .single();

        if (error) throw error;
        
        // Map local ID to server ID
        if (inserted && operation.localId) {
          setIdMap(operation.localId, inserted.id);
        }
        break;
      }

      case 'update': {
        const serverId = idMap[operation.localId] || operation.data.id;
        if (!serverId) {
          console.error('No server ID found for update:', operation.localId);
          return false;
        }

        const { error } = await supabase
          .from(operation.table)
          .update(snakeCaseData)
          .eq('id', serverId);

        if (error) throw error;
        break;
      }

      case 'delete': {
        const serverId = idMap[operation.localId] || operation.data.id;
        if (!serverId) {
          console.error('No server ID found for delete:', operation.localId);
          return false;
        }

        const { error } = await supabase
          .from(operation.table)
          .delete()
          .eq('id', serverId);

        if (error) throw error;
        break;
      }
    }

    return true;
  } catch (error) {
    console.error('Error processing sync operation:', error);
    return false;
  }
};

// Sync all pending operations
export const syncPendingOperations = async (userId: string): Promise<{ success: number; failed: number }> => {
  const queue = getSyncQueue();
  let success = 0;
  let failed = 0;

  console.log(`Syncing ${queue.length} operations...`);

  for (const operation of queue) {
    const result = await processSyncOperation(operation, userId);
    if (result) {
      removeFromQueue(operation.id);
      success++;
    } else {
      incrementRetry(operation.id);
      failed++;
    }
  }

  if (success > 0) {
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  }

  console.log(`Sync complete: ${success} success, ${failed} failed`);
  return { success, failed };
};

// Download all data from server
export const downloadFromServer = async (userId: string): Promise<void> => {
  try {
    console.log('Downloading data from server...');

    // Download routes
    const { data: routes } = await supabase
      .from('routes')
      .select('*')
      .eq('user_id', userId);

    if (routes) {
      // Merge with existing local data instead of replacing
      const existingRoutes = JSON.parse(localStorage.getItem('transport_routes') || '[]');
      const serverRouteIds = new Set(routes.map(r => r.id));
      const localOnlyRoutes = existingRoutes.filter((r: any) => !serverRouteIds.has(r.id));
      
      const localRoutes: Route[] = [
        ...routes.map(r => ({
          id: r.id,
          name: r.name,
          description: '',
          createdAt: new Date(r.created_at)
        })),
        ...localOnlyRoutes
      ];
      localStorage.setItem('transport_routes', JSON.stringify(localRoutes));
    }

    // Download points
    const { data: points } = await supabase
      .from('points')
      .select('*')
      .eq('user_id', userId);

    if (points) {
      const existingPoints = JSON.parse(localStorage.getItem('transport_points') || '[]');
      const serverPointIds = new Set(points.map(p => p.id));
      const localOnlyPoints = existingPoints.filter((p: any) => !serverPointIds.has(p.id));
      
      const localPoints: Point[] = [
        ...points.map(p => ({
          id: p.id,
          routeId: p.route_id,
          name: p.name,
          address: '',
          createdAt: new Date(p.created_at)
        })),
        ...localOnlyPoints
      ];
      localStorage.setItem('transport_points', JSON.stringify(localPoints));
    }

    // Download children
    const { data: children } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', userId);

    if (children) {
      const existingChildren = JSON.parse(localStorage.getItem('transport_children') || '[]');
      const serverChildIds = new Set(children.map(c => c.id));
      const localOnlyChildren = existingChildren.filter((c: any) => !serverChildIds.has(c.id));
      
      const localChildren: Child[] = [
        ...children.map(c => ({
          id: c.id,
          pointId: c.point_id,
          name: c.name,
          responsible: '',
          contact: '',
          createdAt: new Date(c.created_at)
        })),
        ...localOnlyChildren
      ];
      localStorage.setItem('transport_children', JSON.stringify(localChildren));
    }

    // Download attendance
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId);

    if (attendance) {
      const existingAttendance = JSON.parse(localStorage.getItem('transport_attendance') || '[]');
      const serverAttendanceIds = new Set(attendance.map(a => a.id));
      const localOnlyAttendance = existingAttendance.filter((a: any) => !serverAttendanceIds.has(a.id));
      
      const localAttendance: Attendance[] = [
        ...attendance.map(a => ({
          id: a.id,
          childId: a.child_id,
          date: a.date,
          present: a.status === 'present',
          timestamp: new Date(a.created_at)
        })),
        ...localOnlyAttendance
      ];
      localStorage.setItem('transport_attendance', JSON.stringify(localAttendance));
    }

    console.log('Data downloaded successfully');
  } catch (error) {
    console.error('Error downloading from server:', error);
    throw error;
  }
};

// Upload local data to server (for initial sync)
export const uploadLocalDataToServer = async (userId: string): Promise<void> => {
  try {
    console.log('Uploading local data to server...');

    // Upload routes
    const localRoutes = JSON.parse(localStorage.getItem('transport_routes') || '[]');
    for (const route of localRoutes) {
      const { error } = await supabase
        .from('routes')
        .upsert({
          id: route.id,
          user_id: userId,
          name: route.name,
          created_at: route.createdAt,
          updated_at: new Date().toISOString()
        });
      if (error) console.error('Error uploading route:', error);
    }

    // Upload points
    const localPoints = JSON.parse(localStorage.getItem('transport_points') || '[]');
    for (const point of localPoints) {
      const { error } = await supabase
        .from('points')
        .upsert({
          id: point.id,
          user_id: userId,
          route_id: point.routeId,
          name: point.name,
          created_at: point.createdAt,
          updated_at: new Date().toISOString()
        });
      if (error) console.error('Error uploading point:', error);
    }

    // Upload children
    const localChildren = JSON.parse(localStorage.getItem('transport_children') || '[]');
    for (const child of localChildren) {
      const { error } = await supabase
        .from('children')
        .upsert({
          id: child.id,
          user_id: userId,
          point_id: child.pointId,
          name: child.name,
          created_at: child.createdAt,
          updated_at: new Date().toISOString()
        });
      if (error) console.error('Error uploading child:', error);
    }

    // Upload attendance
    const localAttendance = JSON.parse(localStorage.getItem('transport_attendance') || '[]');
    for (const attendance of localAttendance) {
      const { error } = await supabase
        .from('attendance')
        .upsert({
          id: attendance.id,
          user_id: userId,
          child_id: attendance.childId,
          route_id: '', // We need to look this up
          date: attendance.date,
          status: attendance.present ? 'present' : 'absent',
          created_at: attendance.timestamp,
          updated_at: new Date().toISOString()
        });
      if (error) console.error('Error uploading attendance:', error);
    }

    console.log('Local data uploaded successfully');
  } catch (error) {
    console.error('Error uploading local data:', error);
    throw error;
  }
};

// Check if initial sync is needed
export const needsInitialSync = (): boolean => {
  return !localStorage.getItem(LAST_SYNC_KEY);
};

// Get last sync time
export const getLastSyncTime = (): Date | null => {
  const lastSync = localStorage.getItem(LAST_SYNC_KEY);
  return lastSync ? new Date(lastSync) : null;
};
