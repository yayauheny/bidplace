export async function deleteGeneratedImage(uri: string) {
  if (uri.startsWith('blob:')) URL.revokeObjectURL(uri);
  else if (uri.startsWith('file://')) {
    const { File } = await import('expo-file-system');
    const file = new File(uri);
    if (file.exists) file.delete();
  }
}
