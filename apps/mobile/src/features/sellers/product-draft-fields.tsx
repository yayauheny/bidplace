import { createContext, useContext, type ReactNode, type RefObject } from 'react';
import { useController, useFormContext, type FieldPath } from 'react-hook-form';

import { TextField } from '../../components/ui';
import type { ProductDraftFormValues } from './product-draft-form';

const ProductDraftWriteGuardContext = createContext<RefObject<boolean> | null>(null);

export function ProductDraftWriteGuard({
  guard,
  children,
}: {
  guard: RefObject<boolean>;
  children: ReactNode;
}) {
  return (
    <ProductDraftWriteGuardContext.Provider value={guard}>
      {children}
    </ProductDraftWriteGuardContext.Provider>
  );
}

export function useProductDraftWriteGuard() {
  const guard = useContext(ProductDraftWriteGuardContext);
  if (!guard) {
    throw new Error('Product draft write guard is missing');
  }
  return guard;
}

export function ProductDraftTextField({
  name,
  label,
  placeholder,
  editable,
  required,
  multiline,
  keyboardType,
  error,
}: {
  name: FieldPath<ProductDraftFormValues>;
  label: string;
  placeholder?: string;
  editable: boolean;
  required?: boolean;
  multiline?: boolean;
  keyboardType?: 'number-pad';
  error?: string | null;
}) {
  const guard = useProductDraftWriteGuard();
  const { control, setValue } = useFormContext<ProductDraftFormValues>();
  const { field, fieldState } = useController({ control, name });
  const fieldError = typeof fieldState.error?.message === 'string' ? fieldState.error.message : undefined;
  return (
    <TextField
      ref={field.ref}
      label={label}
      value={field.value}
      onChangeText={(value) => {
        if (guard.current) return;
        setValue(name, value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
      }}
      placeholder={placeholder}
      editable={editable}
      required={required}
      multiline={multiline}
      keyboardType={keyboardType}
      error={error === null ? undefined : (error ?? fieldError)}
    />
  );
}
