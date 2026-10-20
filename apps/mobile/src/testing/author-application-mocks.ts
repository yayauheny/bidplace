import { createElement, type ReactNode } from 'react';
import { vi } from 'vitest';

vi.mock('expo-blur', () => ({
  BlurView: ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children),
}));

vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children),
}));

vi.mock('../components/figma/BackButton', () => ({
  BackButton: ({
    label,
    onPress,
    disabled,
  }: {
    label?: string;
    onPress?: () => void;
    disabled?: boolean;
  }) =>
    createElement(
      'button',
      {
        type: 'button',
        disabled,
        onClick: onPress,
        'aria-label': label ?? 'Назад',
      },
      label ?? 'Назад',
    ),
}));

// State-owner tests use DOM controls; real primitives are covered by browser tests.
vi.mock('../components/ui/MotionPressable', () => ({
  MotionPressable: ({
    children,
    onPress,
    disabled,
    accessibilityLabel,
  }: {
    children?:
      | ReactNode
      | ((state: {
          hovered: boolean;
          pressed: boolean;
          focused: boolean;
        }) => ReactNode);
    onPress?: () => void;
    disabled?: boolean;
    accessibilityLabel?: string;
  }) =>
    createElement(
      'button',
      {
        type: 'button',
        onClick: onPress,
        disabled,
        'aria-label': accessibilityLabel,
      },
      typeof children === 'function'
        ? children({ hovered: false, pressed: false, focused: false })
        : children,
    ),
}));

vi.mock('../components/figma/FigmaIcon', () => ({ FigmaIcon: () => null }));
vi.mock('../components/figma/FigmaButton', () => ({
  FigmaButton: ({
    label,
    onPress,
    disabled,
    loading,
  }: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
  }) =>
    createElement(
      'button',
      { type: 'button', disabled: disabled || loading, onClick: onPress },
      label,
    ),
}));
vi.mock('../components/figma/FigmaChoiceChip', () => ({
  FigmaChoiceChip: ({
    label,
    onPress,
    onRemove,
    disabled,
  }: {
    label: string;
    onPress: () => void;
    onRemove?: () => void;
    disabled?: boolean;
  }) =>
    createElement(
      'button',
      { type: 'button', disabled, onClick: onRemove ?? onPress },
      label,
    ),
}));
vi.mock('../components/figma/FigmaSelectField', () => ({
  FigmaSelectField: ({
    label,
    value,
    placeholder,
    onPress,
    disabled,
    error,
  }: {
    label: string;
    value: string;
    placeholder: string;
    onPress: () => void;
    disabled?: boolean;
    error?: string;
  }) =>
    createElement(
      'div',
      null,
      createElement(
        'button',
        { type: 'button', disabled, onClick: onPress, 'aria-label': label },
        value || placeholder,
      ),
      error,
    ),
}));
vi.mock('../components/ui/ExitConfirmDialog', () => ({
  ExitConfirmDialog: ({
    open,
    copy,
    onLeave,
    onContinue,
    busy,
    error,
  }: {
    open: boolean;
    copy: { title: string; description: string };
    onLeave: () => void;
    onContinue: () => void;
    busy?: boolean;
    error?: string;
  }) =>
    open
      ? createElement(
          'div',
          { role: 'dialog', 'aria-label': copy.title },
          copy.title,
          copy.description,
          error,
          createElement(
            'button',
            { type: 'button', disabled: busy, onClick: onLeave },
            'Прервать',
          ),
          createElement(
            'button',
            { type: 'button', disabled: busy, onClick: onContinue },
            'Продолжить',
          ),
        )
      : null,
}));
vi.mock('../components/figma/FilterSheet', () => ({
  FilterSheet: ({
    open,
    children,
    primaryAction,
    onClear,
  }: {
    open: boolean;
    children: ReactNode;
    onClear?: () => void;
    primaryAction?: { label: string; onPress: () => void; disabled?: boolean };
  }) =>
    open
      ? createElement(
          'div',
          { role: 'dialog' },
          children,
          onClear
            ? createElement(
                'button',
                { type: 'button', onClick: onClear },
                'Очистить',
              )
            : null,
          primaryAction
            ? createElement(
                'button',
                {
                  type: 'button',
                  onClick: primaryAction.onPress,
                  disabled: primaryAction.disabled,
                },
                primaryAction.label,
              )
            : null,
        )
      : null,
}));
vi.mock('../components/figma/FilterSearchField', () => ({
  FilterSearchField: () => null,
}));
vi.mock('../components/figma/FilterOptionRow', () => ({
  FilterOptionRow: ({
    label,
    selected,
    onPress,
    disabled,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
    disabled?: boolean;
  }) =>
    createElement(
      'button',
      {
        type: 'button',
        role: 'checkbox',
        'aria-checked': selected,
        disabled,
        onClick: onPress,
      },
      label,
    ),
}));
