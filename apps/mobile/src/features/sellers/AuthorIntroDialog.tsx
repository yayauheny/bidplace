import { Image } from 'react-native';

import { AppDialog, PrimaryButton } from '../../components/ui';
import authorIntroCollage from '../../../assets/author-intro-collage.png';

// The exported artwork is 2x of the 390×360 Figma media layer.
const authorIntroCollageAspectRatio = 780 / 720;

export function AuthorIntroDialog({
  open,
  onStart,
  onClose,
}: {
  open: boolean;
  onStart: () => void;
  onClose: () => void;
}) {
  return (
    <AppDialog
      open={open}
      presentation="mediaSheet"
      title="Стать автором"
      description="Начните продавать свои картины и предметы искусства которые вы создаете сами, пройдите процесс создания профиля автора"
      onClose={onClose}
      media={
        <Image
          source={authorIntroCollage}
          resizeMode="cover"
          style={{
            width: '100%',
            // react-native-web pins the asset's natural height; auto lets aspectRatio size the collage.
            height: 'auto',
            aspectRatio: authorIntroCollageAspectRatio,
          }}
        />
      }
    >
      <PrimaryButton label="Начать" size="auth" width="block" onPress={onStart} />
    </AppDialog>
  );
}
