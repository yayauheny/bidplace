import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

type BoxProps = Omit<HTMLAttributes<HTMLDivElement>, 'color' | 'style'> & {
  children?: ReactNode;
  style?: CSSProperties;
  gap?: number | string;
  alignItems?: CSSProperties['alignItems'];
  justifyContent?: CSSProperties['justifyContent'];
  flexDirection?: CSSProperties['flexDirection'];
  flexWrap?: CSSProperties['flexWrap'];
  flex?: CSSProperties['flex'];
  flexGrow?: CSSProperties['flexGrow'];
  width?: CSSProperties['width'];
  maxWidth?: CSSProperties['maxWidth'];
  minWidth?: CSSProperties['minWidth'];
  minHeight?: CSSProperties['minHeight'];
  padding?: number | string;
  paddingHorizontal?: number | string;
  paddingVertical?: number | string;
  paddingTop?: number | string;
  paddingBottom?: number | string;
  borderRadius?: number | string;
  borderWidth?: number | string;
  borderBottomWidth?: number | string;
  borderBottomColor?: string;
  borderTopWidth?: number | string;
  borderTopColor?: string;
  borderColor?: string;
  backgroundColor?: string;
  overflow?: CSSProperties['overflow'];
  alignSelf?: CSSProperties['alignSelf'];
  textAlign?: CSSProperties['textAlign'];
  margin?: number | string;
  shadowColor?: string | undefined;
  shadowOpacity?: number | undefined;
  shadowRadius?: number | string | undefined;
  shadowOffset?: { width: number; height: number } | undefined;
};

function toCssValue(value: number | string | undefined): string | number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return `${value}px`;
  }

  if (value.startsWith('$')) {
    return `var(--${value.slice(1)})`;
  }

  return value;
}

function toCssColor(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value.startsWith('$')) {
    return `var(--${value.slice(1)})`;
  }

  return value;
}

function resolveShadow(props: BoxProps): string | undefined {
  if (!props.shadowColor && !props.shadowRadius && !props.shadowOffset) {
    return undefined;
  }

  const color = toCssColor(props.shadowColor) ?? 'rgba(0, 0, 0, 0.16)';
  const radius = toCssValue(props.shadowRadius) ?? '24px';
  const offsetX = props.shadowOffset?.width ?? 0;
  const offsetY = props.shadowOffset?.height ?? 0;

  return `${offsetX}px ${offsetY}px ${radius} ${color}`;
}

function Box({
  defaultDirection,
  children,
  style,
  gap,
  alignItems,
  justifyContent,
  flexDirection,
  flexWrap,
  flex,
  flexGrow,
  width,
  maxWidth,
  minWidth,
  minHeight,
  padding,
  paddingHorizontal,
  paddingVertical,
  paddingTop,
  paddingBottom,
  borderRadius,
  borderWidth,
  borderBottomWidth,
  borderBottomColor,
  borderTopWidth,
  borderTopColor,
  borderColor,
  backgroundColor,
  overflow,
  alignSelf,
  textAlign,
  margin,
  shadowColor,
  shadowOpacity,
  shadowRadius,
  shadowOffset,
  ...props
}: BoxProps & { defaultDirection: CSSProperties['flexDirection'] }) {
  const boxShadow = resolveShadow({ shadowColor, shadowOpacity, shadowRadius, shadowOffset });

  return (
    <div
      {...props}
      style={{
        display: 'flex',
        flexDirection: flexDirection ?? defaultDirection,
        gap: toCssValue(gap),
        alignItems,
        justifyContent,
        flexWrap,
        flex,
        flexGrow,
        width: toCssValue(width),
        maxWidth: toCssValue(maxWidth),
        minWidth: toCssValue(minWidth),
        minHeight: toCssValue(minHeight),
        padding: toCssValue(padding),
        paddingLeft: toCssValue(paddingHorizontal),
        paddingRight: toCssValue(paddingHorizontal),
        paddingTop: toCssValue(paddingTop ?? paddingVertical),
        paddingBottom: toCssValue(paddingBottom ?? paddingVertical),
        borderRadius: toCssValue(borderRadius),
        borderWidth: toCssValue(borderWidth),
        borderBottomWidth: toCssValue(borderBottomWidth),
        borderTopWidth: toCssValue(borderTopWidth),
        borderStyle: borderWidth || borderBottomWidth || borderTopWidth ? 'solid' : undefined,
        borderColor: toCssColor(borderColor),
        borderBottomColor: toCssColor(borderBottomColor),
        borderTopColor: toCssColor(borderTopColor),
        backgroundColor: toCssColor(backgroundColor),
        overflow,
        alignSelf,
        textAlign,
        margin: toCssValue(margin),
        boxShadow,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function YStack(props: BoxProps) {
  return <Box {...props} defaultDirection="column" />;
}

export function XStack(props: BoxProps) {
  return <Box {...props} defaultDirection="row" />;
}

export function Stack(props: BoxProps) {
  return <Box {...props} defaultDirection="column" />;
}
