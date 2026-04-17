import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
const WebSocketContext = createContext(null);
export const WebSocketProvider = ({ children, url = import.meta.env.VITE_WS_URL || 'http://localhost:4000', }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user, accessToken } = useAuthStore();
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;
    useEffect(() => {
        // Only connect if user is authenticated
        if (!user || !accessToken) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }
        // Create socket connection with authentication
        const newSocket = io(url, {
            auth: {
                token: accessToken,
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: maxReconnectAttempts,
        });
        // Connection event handlers
        newSocket.on('connect', () => {
            console.log('WebSocket connected');
            setIsConnected(true);
            reconnectAttempts.current = 0;
        });
        newSocket.on('disconnect', (reason) => {
            console.log('WebSocket disconnected:', reason);
            setIsConnected(false);
        });
        newSocket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            reconnectAttempts.current += 1;
            if (reconnectAttempts.current >= maxReconnectAttempts) {
                console.error('Max reconnection attempts reached');
                newSocket.disconnect();
            }
        });
        newSocket.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
        setSocket(newSocket);
        // Cleanup on unmount
        return () => {
            newSocket.disconnect();
        };
    }, [user, accessToken, url]);
    const subscribe = useCallback((event, callback) => {
        if (!socket) {
            console.warn('Socket not connected, cannot subscribe to', event);
            return () => { };
        }
        socket.on(event, callback);
        // Return unsubscribe function
        return () => {
            socket.off(event, callback);
        };
    }, [socket]);
    const emit = useCallback((event, data) => {
        if (!socket) {
            console.warn('Socket not connected, cannot emit', event);
            return;
        }
        socket.emit(event, data);
    }, [socket]);
    const value = {
        socket,
        isConnected,
        subscribe,
        emit,
    };
    return (_jsx(WebSocketContext.Provider, { value: value, children: children }));
};
export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};
