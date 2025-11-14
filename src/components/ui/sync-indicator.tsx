import { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useAuth } from '@/contexts/auth-context';
import { syncPendingOperations, getSyncQueue, downloadFromServer, needsInitialSync } from '@/lib/sync-service';
import { useToast } from '@/hooks/use-toast';

export function SyncIndicator() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Update pending count
  useEffect(() => {
    const updateCount = () => {
      setPendingCount(getSyncQueue().length);
    };

    updateCount();
    const interval = setInterval(updateCount, 2000);
    return () => clearInterval(interval);
  }, []);

  // Sync when coming back online
  useEffect(() => {
    if (wasOffline && isOnline && user && pendingCount > 0) {
      handleSync();
    }
  }, [wasOffline, isOnline, user, pendingCount]);

  // Initial sync on first login
  useEffect(() => {
    if (user && isOnline && needsInitialSync()) {
      handleInitialSync();
    }
  }, [user, isOnline]);

  const handleInitialSync = async () => {
    if (!user || isSyncing) return;

    setIsSyncing(true);
    setSyncStatus('syncing');

    try {
      await downloadFromServer(user.id);
      setSyncStatus('success');
      toast({
        title: 'Dados baixados',
        description: 'Seus dados foram sincronizados da nuvem',
      });
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (error) {
      console.error('Initial sync failed:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSync = async () => {
    if (!user || isSyncing || !isOnline) return;

    setIsSyncing(true);
    setSyncStatus('syncing');

    try {
      const { success, failed } = await syncPendingOperations(user.id);
      
      if (failed > 0) {
        setSyncStatus('error');
        toast({
          title: 'Sincronização parcial',
          description: `${success} operações sincronizadas, ${failed} falharam`,
          variant: 'destructive',
        });
      } else if (success > 0) {
        setSyncStatus('success');
        toast({
          title: 'Sincronizado!',
          description: `${success} alterações enviadas para a nuvem`,
        });
      }

      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      toast({
        title: 'Erro na sincronização',
        description: 'Não foi possível sincronizar com a nuvem',
        variant: 'destructive',
      });
      setTimeout(() => setSyncStatus('idle'), 3000);
    } finally {
      setIsSyncing(false);
      setPendingCount(getSyncQueue().length);
    }
  };

  const getStatusIcon = () => {
    if (!isOnline) {
      return <CloudOff className="h-4 w-4 text-muted-foreground" />;
    }

    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-primary animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return pendingCount > 0 ? (
          <Cloud className="h-4 w-4 text-orange-500" />
        ) : (
          <Cloud className="h-4 w-4 text-green-500" />
        );
    }
  };

  const getStatusText = () => {
    if (!isOnline) {
      return pendingCount > 0 ? `Offline (${pendingCount} pendentes)` : 'Offline';
    }

    switch (syncStatus) {
      case 'syncing':
        return 'Sincronizando...';
      case 'success':
        return 'Sincronizado!';
      case 'error':
        return 'Erro ao sincronizar';
      default:
        return pendingCount > 0 ? `${pendingCount} pendentes` : 'Sincronizado';
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={!isOnline || isSyncing || pendingCount === 0}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/50 border border-border hover:bg-background/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title={isOnline ? 'Clique para sincronizar' : 'Sem conexão'}
    >
      {getStatusIcon()}
      <span className="text-sm font-medium">{getStatusText()}</span>
    </button>
  );
}
