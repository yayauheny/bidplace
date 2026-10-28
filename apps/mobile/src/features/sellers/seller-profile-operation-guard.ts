import { useEffect, useRef, useState } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';

import { canWritePrivateCache, currentAuthEpoch } from '../../lib/query-cache';
import { usePrivateCacheEpoch } from '../../lib/use-private-cache-epoch';

/**
 * Owns screen-session operation state: focus turns, the session operation
 * epoch, the single-flight transition lock and parent operation ids. Every
 * async screen action checks ownership here instead of repeating the refs.
 */
export function useProfileOperationGuard(queryClient: QueryClient) {
  const isFocused = useIsFocused();
  const authEpoch = usePrivateCacheEpoch(queryClient);
  const focusedRef = useRef(isFocused);
  const focusTurn = useRef(0);
  if (focusedRef.current !== isFocused) {
    focusedRef.current = isFocused;
    focusTurn.current += 1;
  }
  const sessionOperation = useRef(0);
  const mountedRef = useRef(true);
  const transitionLock = useRef(false);
  const [inputsLocked, setInputsLocked] = useState(false);
  const parentOperationId = useRef(0);
  const fieldsEditableSeen = useRef<boolean | null>(null);
  const seenAuthEpoch = useRef(authEpoch);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // The screen no longer owns pending saves, submissions or navigation.
      sessionOperation.current += 1;
    };
  }, []);

  useEffect(() => {
    if (seenAuthEpoch.current === authEpoch) return;
    seenAuthEpoch.current = authEpoch;
    sessionOperation.current += 1;
    parentOperationId.current += 1;
    transitionLock.current = false;
    setInputsLocked(false);
  }, [authEpoch]);

  const sessionStillOwns = (operation: number, epoch: number) =>
    mountedRef.current &&
    sessionOperation.current === operation &&
    canWritePrivateCache(queryClient, epoch);
  const screenStillOwns = (operation: number, epoch: number) =>
    focusedRef.current && sessionStillOwns(operation, epoch);
  const screenOwnsOperation = (operation: number) =>
    focusedRef.current && sessionOperation.current === operation;
  const isScreenFocused = () => focusedRef.current;
  const currentOperation = () => sessionOperation.current;
  const bumpParentOperation = () => {
    parentOperationId.current += 1;
  };
  const currentParentOperation = () => parentOperationId.current;
  const beginLockedTransition = () => {
    if (transitionLock.current) return false;
    transitionLock.current = true;
    setInputsLocked(true);
    bumpParentOperation();
    return true;
  };
  const endLockedTransition = () => {
    transitionLock.current = false;
    setInputsLocked(false);
  };
  const releaseTransitionAfterTurn = (operation: number) => {
    queueMicrotask(() => {
      if (!mountedRef.current || sessionOperation.current !== operation) return;
      endLockedTransition();
    });
  };
  const captureAttempt = () => {
    const operation = sessionOperation.current;
    const epoch = currentAuthEpoch(queryClient);
    const startedInFocus = focusTurn.current;
    return {
      operation,
      epoch,
      startedInFocus,
      stillOwnsScreen: () =>
        focusTurn.current === startedInFocus &&
        screenStillOwns(operation, epoch),
    };
  };
  // Children must drop stale in-flight writes when editability flips off.
  const noteFieldsEditable = (fieldsEditable: boolean) => {
    if (fieldsEditableSeen.current === true && !fieldsEditable) {
      parentOperationId.current += 1;
    }
    fieldsEditableSeen.current = fieldsEditable;
  };

  return {
    authEpoch,
    isFocused,
    focusTurn,
    transitionLock,
    inputsLocked,
    sessionStillOwns,
    screenStillOwns,
    screenOwnsOperation,
    isScreenFocused,
    currentOperation,
    bumpParentOperation,
    currentParentOperation,
    beginLockedTransition,
    endLockedTransition,
    releaseTransitionAfterTurn,
    captureAttempt,
    noteFieldsEditable,
  };
}

export type ProfileOperationGuard = ReturnType<typeof useProfileOperationGuard>;
