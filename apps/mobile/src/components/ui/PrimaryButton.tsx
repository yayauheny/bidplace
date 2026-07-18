import type { ComponentPropsWithoutRef } from 'react';

import { AppButton } from './AppButton';

export function PrimaryButton(props: ComponentPropsWithoutRef<typeof AppButton>) {
  return <AppButton {...props} tone={props.tone ?? 'primary'} />;
}
