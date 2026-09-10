export function visibleWorkStory(story?: string | null) {
  const body = story?.trim() ?? '';
  return body.length > 0 ? body : null;
}
