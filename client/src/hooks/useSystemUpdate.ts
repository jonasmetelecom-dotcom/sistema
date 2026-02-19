
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useSystemUpdate = () => {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [commitsBehind, setCommitsBehind] = useState(0);
    const [changelog, setChangelog] = useState<string[]>([]);
    const [checking, setChecking] = useState(false);

    const checkUpdate = useCallback(async () => {
        if (import.meta.env.DEV) {
            // Mock for dev
            setUpdateAvailable(true);
            setCommitsBehind(3);
            setChangelog(['feat: notification bell', 'fix: layout glitch', 'chore: update deps']);
            return;
        }

        setChecking(true);
        try {
            const res = await api.get('/system/check-update');
            if (res.data.updateAvailable) {
                setUpdateAvailable(true);
                setCommitsBehind(res.data.commitsBehind);
                setChangelog(res.data.changelog || []);
            } else {
                setUpdateAvailable(false);
            }
        } catch (error) {
            console.error('Failed to check for updates', error);
        } finally {
            setChecking(false);
        }
    }, []);

    const triggerUpdate = async () => {
        return api.post('/system/trigger-update');
    };

    useEffect(() => {
        checkUpdate();
        const interval = setInterval(checkUpdate, 3600000); // 1h
        return () => clearInterval(interval);
    }, [checkUpdate]);

    return {
        updateAvailable,
        commitsBehind,
        changelog,
        checking,
        checkUpdate,
        triggers: { triggerUpdate }
    };
};
