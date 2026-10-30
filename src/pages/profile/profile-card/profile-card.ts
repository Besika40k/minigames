import { ApiError, isOutcomeUnknown } from '../../../api/api-error.ts';
import { fetchUserProfile, saveUserProfile } from '../../../api/profile-api.ts';
import { createButton, setButtonBusy } from '../../../components/button/button.ts';
import { createAsyncArea, type AsyncArea } from '../../../components/feedback/async-area.ts';
import { createProfileAvatar } from '../../../components/profile/profile.ts';
import { createSkeleton } from '../../../components/skeleton/skeleton.ts';
import { showSnackbar } from '../../../components/snackbar/snackbar.ts';
import {
  BIO_MAX_LENGTH,
  PHOTO_MAX_FILE_BYTES,
  PHOTO_SIZE,
  PROFILE_CONTENT,
} from '../../../data/profile.ts';
import { ButtonSize, ButtonVariant } from '../../../types/button.ts';
import { SnackbarVariant, type ChangeMessages } from '../../../types/feedback.ts';
import type { PictureMessages, UserProfile } from '../../../types/profile.ts';
import type { AppSession } from '../../../types/session.ts';
import { createElement } from '../../../utils/create-element.ts';
import { getProfileName } from '../../../utils/profile-name.ts';
import { isImageFile, resizeToSquare } from '../../../utils/resize-image.ts';
import './profile-card.scss';

const TITLE_ID = 'profile-title';
const BIO_TITLE_ID = 'profile-bio-title';
const BIO_INPUT_ID = 'profile-bio-input';
const BIO_COUNTER_ID = 'profile-bio-counter';

const PICTURE_MESSAGES: PictureMessages = PROFILE_CONTENT.pictureMessages;

export interface ProfileCardOptions {
  readonly session: AppSession;
  // Checks the session before a change. A guest gets undefined, and the auth
  // dialog.
  readonly requireSession: (warning: string) => AppSession | undefined;
  // The picture the header shows changed, or there is none any more
  readonly onPhotoChange: (photo: string | undefined) => void;
}

export interface ProfileCard {
  readonly element: HTMLElement;
  // Cancels the request when the page closes
  readonly abort: () => void;
}

// A bio that can be saved: at most 300 characters after trimming
function isBioValid(text: string): boolean {
  return text.trim().length <= BIO_MAX_LENGTH;
}

function createBioSkeleton(): readonly Node[] {
  return [
    createElement('div', {
      className: 'profile-card__skeleton',
      attributes: { 'aria-hidden': 'true' },
      children: [
        createSkeleton('profile-card__skeleton-line'),
        createSkeleton('profile-card__skeleton-line profile-card__skeleton-line--short'),
      ],
    }),
  ];
}

// Why a chosen file cannot be a profile picture, or undefined when it can
function getFileProblem(file: File): string | undefined {
  if (!isImageFile(file)) {
    return PICTURE_MESSAGES.notImage;
  }

  return file.size > PHOTO_MAX_FILE_BYTES ? PICTURE_MESSAGES.tooLarge : undefined;
}

// The top of the profile page: the picture with its buttons, the name and
// email, and the bio with its form. The name and email come from the session
// and show at once; the picture and the bio come from the database. Every
// change saves the whole profile and shows only what the database confirms.
export function createProfileCard(options: ProfileCardOptions): ProfileCard {
  const name: string = getProfileName(options.session);
  // The profile as the database last confirmed it, once it has loaded
  const state: { profile: UserProfile | undefined; isPending: boolean } = {
    profile: undefined,
    isPending: false,
  };

  const avatarBox: HTMLDivElement = createElement('div', { className: 'profile-card__avatar' });
  const fileInput: HTMLInputElement = createElement('input', {
    className: 'profile-card__file',
    attributes: { type: 'file', accept: 'image/*', tabindex: '-1', 'aria-hidden': 'true' },
  });
  const changeButton: HTMLButtonElement = createButton({
    variant: ButtonVariant.Outlined,
    size: ButtonSize.Small,
    text: PROFILE_CONTENT.changePictureText,
    onClick: (): void => {
      fileInput.click();
    },
  });
  const pictureRemoveButton: HTMLButtonElement = createButton({
    variant: ButtonVariant.Outlined,
    size: ButtonSize.Small,
    text: PROFILE_CONTENT.removePictureText,
  });
  const editButton: HTMLButtonElement = createButton({
    variant: ButtonVariant.Outlined,
    size: ButtonSize.Small,
    text: PROFILE_CONTENT.editBioText,
  });

  const bioText: HTMLParagraphElement = createElement('p', { className: 'profile-card__bio' });
  const bioInput: HTMLTextAreaElement = createElement('textarea', {
    className: 'profile-card__bio-input',
    attributes: {
      id: BIO_INPUT_ID,
      rows: '4',
      placeholder: PROFILE_CONTENT.bioPlaceholder,
      'aria-describedby': BIO_COUNTER_ID,
    },
  });
  const counter: HTMLParagraphElement = createElement('p', {
    className: 'profile-card__counter',
    attributes: { id: BIO_COUNTER_ID, 'aria-live': 'polite' },
  });
  const saveButton: HTMLButtonElement = createButton({
    variant: ButtonVariant.Filled,
    size: ButtonSize.Small,
    type: 'submit',
    text: PROFILE_CONTENT.saveBioText,
  });
  const cancelButton: HTMLButtonElement = createButton({
    variant: ButtonVariant.Outlined,
    size: ButtonSize.Small,
    text: PROFILE_CONTENT.cancelText,
  });
  const bioForm: HTMLFormElement = createElement('form', {
    className: 'profile-card__bio-form',
    attributes: { novalidate: '' },
    children: [
      createElement('label', {
        className: 'profile-card__hidden',
        text: PROFILE_CONTENT.bioLabel,
        attributes: { for: BIO_INPUT_ID },
      }),
      bioInput,
      counter,
      createElement('div', {
        className: 'profile-card__form-actions',
        children: [cancelButton, saveButton],
      }),
    ],
  });

  // The bio, or its skeleton or the error banner while it cannot show
  const bioArea: HTMLDivElement = createElement('div', { className: 'profile-card__bio-area' });

  // The picture of the database, else the account's photo, else the initials
  const showAvatar = (): void => {
    avatarBox.replaceChildren(
      createProfileAvatar(name, state.profile?.photo ?? options.session.avatarUrl),
    );
  };

  // The buttons work once the profile has loaded, and not while a change is
  // on its way
  const updateControls = (): void => {
    const isReady: boolean = state.profile !== undefined && !state.isPending;
    changeButton.disabled = !isReady;
    pictureRemoveButton.disabled = !isReady;
    editButton.disabled = !isReady;
    pictureRemoveButton.hidden = state.profile?.photo === undefined;
    const isValid: boolean = isBioValid(bioInput.value);
    saveButton.disabled = !isReady || !isValid;
  };

  const updateCounter = (): void => {
    const isValid: boolean = isBioValid(bioInput.value);
    counter.textContent = isValid
      ? `${String(bioInput.value.trim().length)} / ${String(BIO_MAX_LENGTH)}`
      : PROFILE_CONTENT.bioMessages.tooLong;
    counter.classList.toggle('profile-card__counter--error', !isValid);
    bioInput.setAttribute('aria-invalid', String(!isValid));
    updateControls();
  };

  // The form takes the place of the bio while it is open
  const setEditing = (isEditing: boolean): void => {
    bioForm.hidden = !isEditing;
    bioText.hidden = isEditing;
    editButton.hidden = isEditing;
    if (!isEditing) {
      return;
    }
    bioInput.value = state.profile?.bio ?? '';
    updateCounter();
    bioInput.focus();
  };

  const showProfile = (profile: UserProfile): void => {
    state.profile = profile;
    bioText.textContent = profile.bio === '' ? PROFILE_CONTENT.emptyBioText : profile.bio;
    bioText.classList.toggle('profile-card__bio--empty', profile.bio === '');
    showAvatar();
    updateControls();
    options.onPhotoChange(profile.photo);
  };

  const area: AsyncArea = createAsyncArea({
    container: bioArea,
    messages: PROFILE_CONTENT.profileMessages,
    load: (): Promise<UserProfile> => fetchUserProfile(options.session.email),
    renderSkeleton: (): readonly Node[] => {
      state.profile = undefined;
      setEditing(false);
      updateControls();
      return createBioSkeleton();
    },
    renderData: (profile: UserProfile): readonly Node[] => {
      showProfile(profile);
      return [bioText, bioForm];
    },
    isEmpty: (): boolean => false,
    renderEmpty: (): readonly Node[] => [],
  });

  // Saves a changed profile for the signed-in user. A refusal says why and
  // leaves the card as it was; a failure whose outcome is unknown loads the
  // profile again to show where it stands.
  const saveProfile = async (
    next: UserProfile,
    button: HTMLButtonElement,
    messages: ChangeMessages,
    successText: string,
    onSaved?: () => void,
  ): Promise<void> => {
    const session: AppSession | undefined = options.requireSession(messages.loginWarning);
    if (session === undefined) {
      return;
    }
    state.isPending = true;
    setButtonBusy(button, true);
    updateControls();
    try {
      await saveUserProfile(session.email, next);
      showProfile(next);
      showSnackbar({ variant: SnackbarVariant.Success, text: successText });
      onSaved?.();
    } catch (error: unknown) {
      if (error instanceof ApiError && !isOutcomeUnknown(error)) {
        showSnackbar({ variant: SnackbarVariant.Error, text: error.message });
      } else {
        showSnackbar({ variant: SnackbarVariant.Warning, text: messages.unconfirmed });
        area.reload();
      }
    } finally {
      state.isPending = false;
      setButtonBusy(button, false);
      updateControls();
    }
  };

  // A chosen picture is checked, cut to a small square and saved
  const choosePicture = async (file: File, profile: UserProfile): Promise<void> => {
    const problem: string | undefined = getFileProblem(file);
    if (problem !== undefined) {
      showSnackbar({ variant: SnackbarVariant.Error, text: problem });
      return;
    }
    let photo: string;
    try {
      photo = await resizeToSquare(file, PHOTO_SIZE);
    } catch {
      showSnackbar({ variant: SnackbarVariant.Error, text: PICTURE_MESSAGES.unreadable });
      return;
    }
    await saveProfile(
      { ...profile, photo },
      changeButton,
      PICTURE_MESSAGES,
      PICTURE_MESSAGES.saved,
    );
  };

  fileInput.addEventListener('change', (): void => {
    const [file] = fileInput.files ?? [];
    // The same file can be chosen again after a failed save
    fileInput.value = '';
    if (file !== undefined && state.profile !== undefined) {
      void choosePicture(file, state.profile);
    }
  });
  pictureRemoveButton.addEventListener('click', (): void => {
    if (state.profile === undefined) {
      return;
    }
    void saveProfile(
      { bio: state.profile.bio },
      pictureRemoveButton,
      PICTURE_MESSAGES,
      PICTURE_MESSAGES.removed,
    );
  });
  editButton.addEventListener('click', (): void => {
    setEditing(true);
  });
  cancelButton.addEventListener('click', (): void => {
    setEditing(false);
    editButton.focus();
  });
  bioInput.addEventListener('input', updateCounter);

  // A saved bio closes the form
  bioForm.addEventListener('submit', (event: SubmitEvent): void => {
    event.preventDefault();
    if (state.profile === undefined || state.isPending || !isBioValid(bioInput.value)) {
      return;
    }
    void saveProfile(
      { ...state.profile, bio: bioInput.value.trim() },
      saveButton,
      PROFILE_CONTENT.bioMessages,
      PROFILE_CONTENT.bioMessages.saved,
      (): void => {
        setEditing(false);
        editButton.focus();
      },
    );
  });

  showAvatar();
  setEditing(false);
  area.reload();

  const identity: HTMLDivElement = createElement('div', {
    className: 'profile-card__identity',
    children: [
      createElement('h1', {
        className: 'profile-card__name',
        text: name,
        attributes: { id: TITLE_ID },
      }),
      createElement('p', { className: 'profile-card__email', text: options.session.email }),
      createElement('div', {
        className: 'profile-card__picture-actions',
        children: [changeButton, pictureRemoveButton, fileInput],
      }),
    ],
  });
  const aboutHeader: HTMLDivElement = createElement('div', {
    className: 'profile-card__about-header',
    children: [
      createElement('h2', {
        className: 'profile-card__subtitle',
        text: PROFILE_CONTENT.bioTitle,
        attributes: { id: BIO_TITLE_ID },
      }),
      editButton,
    ],
  });

  const element: HTMLElement = createElement('section', {
    className: 'profile-card',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [
      createElement('div', { className: 'profile-card__top', children: [avatarBox, identity] }),
      createElement('section', {
        className: 'profile-card__about',
        attributes: { 'aria-labelledby': BIO_TITLE_ID },
        children: [aboutHeader, bioArea],
      }),
    ],
  });

  return {
    element,
    abort: (): void => {
      area.abort();
    },
  };
}
