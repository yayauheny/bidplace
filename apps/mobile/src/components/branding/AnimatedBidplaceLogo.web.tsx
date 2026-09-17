import { useRef } from 'react';

import { designTokens } from '@bidplace/design-tokens';

import { useReducedMotion } from '../../lib/reduced-motion';
import {
  BIDPLACE_LOGO_BLINK_MS,
  BIDPLACE_LOGO_BOUNCE_LIFT_PX,
  BIDPLACE_LOGO_BOUNCE_MS,
  bidplaceLogoGlanceTranslate,
  bidplaceLogoMark,
  bidplaceLogoMotionActive,
  type BidplaceLogoMotion,
} from './bidplace-logo-mark';

const FALL_MS = 760;
const PAUSE_MS = 130;
const GLANCE_MS = 500;

const BIDPLACE_LOGO_MOTION_CSS = `@keyframes bidplace-logo-fall {
  0% {
    transform: translate3d(0, -70vh, 0) scale(1, 1);
    animation-timing-function: ease-in;
  }
  39% {
    transform: translate3d(0, 0, 0) scale(1.025, 0.96);
    animation-timing-function: ease-out;
  }
  60% {
    transform: translate3d(0, -22%, 0) scale(0.995, 1.01);
    animation-timing-function: ease-in;
  }
  76% {
    transform: translate3d(0, 0, 0) scale(1.01, 0.99);
    animation-timing-function: ease-out;
  }
  88% {
    transform: translate3d(0, -7%, 0) scale(1, 1);
    animation-timing-function: ease-in;
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1, 1);
  }
}
@keyframes bidplace-logo-glance {
  0% { transform: translate(0, 0); }
  38% { transform: translate(${bidplaceLogoGlanceTranslate.x}, ${bidplaceLogoGlanceTranslate.y}); }
  60% { transform: translate(${bidplaceLogoGlanceTranslate.x}, ${bidplaceLogoGlanceTranslate.y}); }
  100% { transform: translate(0, 0); }
}
@keyframes bidplace-logo-bounce {
  0% {
    transform: translate3d(0, 0, 0) scale(1, 1);
  }
  42% {
    transform: translate3d(0, -${BIDPLACE_LOGO_BOUNCE_LIFT_PX}px, 0) scale(0.995, 1.01);
  }
  80% {
    transform: translate3d(0, 0, 0) scale(1.02, 0.97);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1, 1);
  }
}
@keyframes bidplace-logo-blink {
  0% { transform: scaleY(1); }
  15% { transform: scaleY(0.08); }
  35% { transform: scaleY(1); }
  54% { transform: scaleY(1); }
  69% { transform: scaleY(0.08); }
  88% { transform: scaleY(1); }
  100% { transform: scaleY(1); }
}
.bidplace-logo-fall {
  transform-origin: 50% 100%;
  animation: bidplace-logo-fall ${FALL_MS}ms 1 forwards;
}
.bidplace-logo-bounce {
  transform-origin: 50% 100%;
  animation: bidplace-logo-bounce ${BIDPLACE_LOGO_BOUNCE_MS}ms ease-in-out infinite;
}
.bidplace-logo-pupils {
  transform-box: view-box;
  transform-origin: 0 0;
  animation: bidplace-logo-glance ${GLANCE_MS}ms ${designTokens.motion.easing} ${FALL_MS + PAUSE_MS}ms 1 both;
}
.bidplace-logo-glance-pupils {
  transform-box: view-box;
  transform-origin: 0 0;
  animation: bidplace-logo-glance ${GLANCE_MS}ms ${designTokens.motion.easing} 1 both;
}
.bidplace-logo-eye {
  transform-box: fill-box;
  transform-origin: 50% 50%;
}
.bidplace-logo-blink .bidplace-logo-eye {
  animation: bidplace-logo-blink ${BIDPLACE_LOGO_BLINK_MS}ms 1 both;
}
@media (prefers-reduced-motion: reduce) {
  .bidplace-logo-fall,
  .bidplace-logo-bounce,
  .bidplace-logo-pupils,
  .bidplace-logo-glance-pupils,
  .bidplace-logo-blink .bidplace-logo-eye {
    animation: none;
  }
}
`;

function wrapperClassName(motion: BidplaceLogoMotion, animate: boolean) {
  if (!animate) {
    return undefined;
  }
  if (motion === 'intro') {
    return 'bidplace-logo-fall';
  }
  if (motion === 'loading') {
    return 'bidplace-logo-bounce';
  }
  if (motion === 'error') {
    return 'bidplace-logo-blink';
  }
  return undefined;
}

export function AnimatedBidplaceLogo({
  motion = 'static',
  size = 168,
  onLoadingCycleEnd,
}: {
  motion?: BidplaceLogoMotion;
  size?: number;
  onLoadingCycleEnd?: () => boolean | void;
}) {
  const reducedMotion = useReducedMotion();
  const animate = bidplaceLogoMotionActive(motion, reducedMotion);
  const height =
    (size * bidplaceLogoMark.viewBox.height) / bidplaceLogoMark.viewBox.width;
  const pupils = bidplaceLogoMark.pupils.default;
  const glancePupils = animate && (motion === 'intro' || motion === 'glance');
  const pupilClass = glancePupils
    ? motion === 'intro'
      ? 'bidplace-logo-pupils'
      : 'bidplace-logo-glance-pupils'
    : undefined;
  const previousMotion = useRef(motion);
  const stopBounceAtBoundary = useRef(false);
  if (previousMotion.current !== motion) {
    if (motion === 'loading') {
      stopBounceAtBoundary.current = false;
    }
    previousMotion.current = motion;
  }

  return (
    <div
      className={wrapperClassName(motion, animate)}
      style={{
        width: size,
        height,
        animationPlayState:
          animate && motion === 'loading'
            ? stopBounceAtBoundary.current
              ? 'paused'
              : 'running'
            : undefined,
      }}
      onAnimationIteration={
        animate && motion === 'loading'
          ? (event) => {
              if (
                event.animationName &&
                event.animationName !== 'bidplace-logo-bounce'
              ) {
                return;
              }
              if (onLoadingCycleEnd?.()) {
                stopBounceAtBoundary.current = true;
                event.currentTarget.style.animationPlayState = 'paused';
              }
            }
          : undefined
      }
    >
      <style>{BIDPLACE_LOGO_MOTION_CSS}</style>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${bidplaceLogoMark.viewBox.width} ${bidplaceLogoMark.viewBox.height}`}
        role="img"
        aria-label="Bidplace"
        shapeRendering="geometricPrecision"
        style={{ display: 'block' }}
      >
        <g>
          <path d={bidplaceLogoMark.bodyPath} fill="#000000" />
        </g>
        <g className="bidplace-logo-eye">
          <circle
            cx={bidplaceLogoMark.eyes.left.cx}
            cy={bidplaceLogoMark.eyes.left.cy}
            r={bidplaceLogoMark.eyes.left.r}
            fill="#FFFFFF"
          />
          <circle
            className={pupilClass}
            cx={pupils.left.cx}
            cy={pupils.left.cy}
            r={pupils.left.r}
            fill="#000000"
          />
        </g>
        <g className="bidplace-logo-eye">
          <circle
            cx={bidplaceLogoMark.eyes.right.cx}
            cy={bidplaceLogoMark.eyes.right.cy}
            r={bidplaceLogoMark.eyes.right.r}
            fill="#FFFFFF"
          />
          <circle
            className={pupilClass}
            cx={pupils.right.cx}
            cy={pupils.right.cy}
            r={pupils.right.r}
            fill="#000000"
          />
        </g>
      </svg>
    </div>
  );
}
