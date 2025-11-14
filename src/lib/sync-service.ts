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
      const localRoutes: Route[] = routes.map(r => ({
        id: r.id,
        name: r.name,
        description: '',
        createdAt: new Date(r.created_at)
      }));
      localStorage.setItem('transport_routes', JSON.stringify(localRoutes));
    }

    // Download points
    const { data: points } = await supabase
      .from('points')
      .select('*')
      .eq('user_id', userId);

    if (points) {
      const localPoints: Point[] = points.map(p => ({
        id: p.id,
        routeId: p.route_id,
        name: p.name,
        address: '',
        createdAt: new Date(p.created_at)
      }));
      localStorage.setItem('transport_points', JSON.stringify(localPoints));
    }

    // Download children
    const { data: children } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', userId);

    if (children) {
      const localChildren: Child[] = children.map(c => ({
        id: c.id,
        pointId: c.point_id,
        name: c.name,
        responsible: '',
        contact: '',
        createdAt: new Date(c.created_at)
      }));
      localStorage.setItem('transport_children', JSON.stringify(localChildren));
    }

    // Download attendance
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId);

    if (attendance) {
      const localAttendance: Attendance[] = attendance.map(a => ({
        id: a.id,
        childId: a.child_id,
        date: a.date,
        present: a.status === 'present',
        timestamp: new Date(a.created_at)
      }));
      localStorage.setItem('transport_attendance', JSON.stringify(localAttendance));
    }

    console.log('Data downloaded successfully');
  } catch (error) {
    console.error('Error downloading from server:', error);
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
