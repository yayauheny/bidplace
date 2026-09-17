import { designTokens, type TextRole } from '@bidplace/design-tokens';

export type InfrastructureErrorPresentation = 'page' | 'inline';

export const INFRASTRUCTURE_ERROR_TEXT_ROLE: TextRole = 'workTitle';
export const INFRASTRUCTURE_ERROR_COPY_MAX_WIDTH = 300;

export function showsInfrastructureErrorLogo(
  presentation: InfrastructureErrorPresentation = 'page',
) {
  return presentation === 'page';
}

export const infrastructurePageErrorLayout = {
  padX: designTokens.space.x5,
  clusterGap: designTokens.space.x8,
  clusterLift: designTokens.space.x8,
} as const;
