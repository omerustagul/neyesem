import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

type NotificationType = 'success' | 'error' | 'info';

interface NotificationState {
    visible: boolean;
    message: string;
    type: NotificationType;
    title?: string;
}

interface NotificationContextData {
    state: NotificationState;
    showNotification: (message: string, type?: NotificationType, title?: string) => void;
    hideNotification: () => void;
    notificationHeight: number;
    setNotificationHeight: (height: number) => void;
}

const NotificationContext = createContext<NotificationContextData>({} as NotificationContextData);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<NotificationState>({
        visible: false,
        message: '',
        type: 'info'
    });
    const [notificationHeight, setNotificationHeight] = useState(0);
    const timerRef = useRef<any>(null);

    const hideNotification = useCallback(() => {
        setState(prev => ({ ...prev, visible: false }));
        // We delay setting height to 0 to allow exit animation if needed
        setTimeout(() => setNotificationHeight(0), 500);
        if (timerRef.current) clearTimeout(timerRef.current);
    }, []);

    const showNotification = useCallback((message: string, type: NotificationType = 'info', title?: string) => {
        if (timerRef.current) clearTimeout(timerRef.current);

        setState({
            visible: true,
            message,
            type,
            title
        });

        timerRef.current = setTimeout(() => {
            hideNotification();
        }, 3500);
    }, [hideNotification]);

    return (
        <NotificationContext.Provider value={{
            state,
            showNotification,
            hideNotification,
            notificationHeight,
            setNotificationHeight
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);
