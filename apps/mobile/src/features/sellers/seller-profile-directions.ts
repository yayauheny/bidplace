import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';

import type { ProfileOperationGuard } from './seller-profile-operation-guard';

export type SellerProfileDirectionLabel = { id: string; name: string };

/**
 * Owns the directions (categories) UI state: label resolution, the picker
 * sheet, the "at least one direction" requirement reveal and edits.
 */
export function useProfileDirections({
  knownDirections,
  categories,
  directionCategoryIds,
  fieldsEditable,
  transitionLock,
  setDirectionIds,
  guard,
}: {
  knownDirections: SellerProfileDirectionLabel[] | undefined;
  categories: SellerProfileDirectionLabel[] | undefined;
  directionCategoryIds: string[] | undefined;
  fieldsEditable: boolean;
  transitionLock: RefObject<boolean>;
  setDirectionIds: (ids: string[]) => void;
  guard: ProfileOperationGuard;
}) {
  const [directionsPickerOpen, setDirectionsPickerOpen] = useState(false);
  const [directionsRequirementRevealed, setDirectionsRequirementRevealed] =
    useState(false);
  const seenAuthEpoch = useRef(guard.authEpoch);

  useEffect(() => {
    if (seenAuthEpoch.current === guard.authEpoch) return;
    seenAuthEpoch.current = guard.authEpoch;
    setDirectionsPickerOpen(false);
    setDirectionsRequirementRevealed(false);
  }, [guard.authEpoch]);

  const directionLabels = useMemo(() => {
    const names = new Map(
      [...(knownDirections ?? []), ...(categories ?? [])].map((direction) => [
        direction.id,
        direction.name,
      ]),
    );
    return (directionCategoryIds ?? []).flatMap((id) => {
      const name = names.get(id);
      return name ? [{ id, name }] : [];
    });
  }, [knownDirections, categories, directionCategoryIds]);

  const directionsError =
    directionsRequirementRevealed && (directionCategoryIds?.length ?? 0) === 0
      ? 'Выберите хотя бы одно направление'
      : undefined;

  const removeDirection = (id: string) => {
    if (!fieldsEditable || transitionLock.current) return;
    setDirectionIds(
      (directionCategoryIds ?? []).filter((value) => value !== id),
    );
    setDirectionsRequirementRevealed(true);
  };
  const openDirectionsPicker = () => {
    if (fieldsEditable) setDirectionsPickerOpen(true);
  };
  const applyDirections = (ids: string[]) => {
    if (!fieldsEditable || transitionLock.current) return;
    setDirectionIds(ids);
    if (ids.length > 0) setDirectionsRequirementRevealed(false);
  };

  return {
    directionLabels,
    directionsError,
    directionsPickerOpen,
    setDirectionsPickerOpen,
    removeDirection,
    openDirectionsPicker,
    applyDirections,
    revealRequirement: () => setDirectionsRequirementRevealed(true),
  };
}

export type ProfileDirections = ReturnType<typeof useProfileDirections>;
