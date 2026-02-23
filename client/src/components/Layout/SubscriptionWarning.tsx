import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import { useState, useEffect } from 'react';

export const SubscriptionWarning = () => {
    const { user } = useAuth();
    const [daysLeft, setDaysLeft] = useState<number | null>(null);

    useEffect(() => {
        if (user?.tenant?.subscriptionEndsAt && user?.tenant?.plan !== 'free') {
            try {
                // Parse date string (YYYY-MM-DD) part directly to avoid timezone shift
                const dateStr = user.tenant.subscriptionEndsAt.split('T')[0];
                const [year, month, day] = dateStr.split('-').map(Number);

                // Expiration date at local midnight
                const expirationDate = new Date(year, month - 1, day);

                // Today date at local midnight
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                const diffTime = expirationDate.getTime() - today.getTime();
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                console.log(`[SubscriptionCheck] Raw: ${user.tenant.subscriptionEndsAt}, Target: ${dateStr}, Today: ${today.toLocaleDateString()}, Diff: ${diffDays}`);
                setDaysLeft(diffDays);
            } catch (e) {
                console.error('[SubscriptionCheck] Error:', e);
                setDaysLeft(null);
            }
        } else {
            setDaysLeft(null);
        }
    }, [user]);

    // Only show for Pro/Enterprise and when near expiry or expired
    // FIX: daysLeft === 0 was hitting !daysLeft
    if (daysLeft === null || daysLeft > 10 || user?.tenant?.plan === 'free') {
        return null;
    }

    // Stage 1: Warning (4-10 days) - Subtle Yellow
    if (daysLeft > 3) {
        return (
            <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top duration-500">
                <Clock size={16} className="text-yellow-500" />
                <p className="text-xs font-medium text-yellow-200">
                    Sua assinatura <span className="font-bold uppercase">{user?.tenant?.plan}</span> expira em {daysLeft} dias.
                    <button className="ml-2 underline hover:text-white transition-colors">Renovar agora</button>
                </p>
            </div>
        );
    }

    // Stage 2: Critical (0-3 days) - Pulsing Red
    if (daysLeft >= 0) {
        return (
            <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center justify-center gap-3 animate-pulse">
                <AlertTriangle size={18} className="text-red-500" />
                <p className="text-sm font-bold text-red-200 text-center">
                    ATENÇÃO: Acesso será bloqueado em {daysLeft === 0 ? 'algumas horas' : `${daysLeft} dias`}.
                    <button className="ml-3 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs transition-colors shadow-lg">Regularizar Assinatura</button>
                </p>
            </div>
        );
    }

    // Stage 3: Overdue
    return (
        <div className="bg-red-900/40 border-b border-red-500 px-4 py-3 flex items-center justify-center gap-3">
            <ShieldAlert size={20} className="text-red-500" />
            <p className="text-sm font-black text-white uppercase tracking-tighter">
                Assinatura Expirada! Regularize para evitar o bloqueio total.
            </p>
            <button className="px-4 py-1.5 bg-white text-red-900 rounded-lg font-bold text-xs hover:bg-gray-200 transition-colors">Falar com Suporte</button>
        </div>
    );
};
