import { useState, useCallback, useRef } from 'react';

interface HistoryState<T> {
    past: T[];
    present: T;
    future: T[];
}

export function useHistory<T>(initialState: T, maxDepth = 50) {
    const [history, setHistory] = useState<HistoryState<T>>({
        past: [],
        present: initialState,
        future: [],
    });

    // Use ref to avoid stale closures in keyboard handler
    const historyRef = useRef(history);
    historyRef.current = history;

    const setState = useCallback((newState: T | ((prev: T) => T)) => {
        setHistory(prev => {
            const resolved = typeof newState === 'function'
                ? (newState as (prev: T) => T)(prev.present)
                : newState;

            // Don't push if identical (shallow ref check)
            if (resolved === prev.present) return prev;

            const newPast = [...prev.past, prev.present].slice(-maxDepth);
            return {
                past: newPast,
                present: resolved,
                future: [], // clear redo stack on new action
            };
        });
    }, [maxDepth]);

    const undo = useCallback(() => {
        setHistory(prev => {
            if (prev.past.length === 0) return prev;
            const newPast = prev.past.slice(0, -1);
            const previous = prev.past[prev.past.length - 1];
            return {
                past: newPast,
                present: previous,
                future: [prev.present, ...prev.future],
            };
        });
    }, []);

    const redo = useCallback(() => {
        setHistory(prev => {
            if (prev.future.length === 0) return prev;
            const next = prev.future[0];
            return {
                past: [...prev.past, prev.present],
                present: next,
                future: prev.future.slice(1),
            };
        });
    }, []);

    const canUndo = history.past.length > 0;
    const canRedo = history.future.length > 0;

    return {
        state: history.present,
        setState,
        undo,
        redo,
        canUndo,
        canRedo,
    };
}
