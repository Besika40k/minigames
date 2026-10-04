// A click on the backdrop reaches the dialog itself, but so does a click on the
// dialog's own padding. Only a click outside the dialog's box is on the backdrop.
function isOnBackdrop(dialog: HTMLDialogElement, event: MouseEvent): boolean {
  if (event.target !== dialog) {
    return false;
  }

  const box: DOMRect = dialog.getBoundingClientRect();

  return (
    event.clientX < box.left ||
    event.clientX > box.right ||
    event.clientY < box.top ||
    event.clientY > box.bottom
  );
}

// Lets a modal dialog close with the Esc key and with a click on its backdrop.
// `onDismiss` decides how: a dialog kept in the address closes by changing
// the address, the others simply close.
export function enableDialogDismiss(
  dialog: HTMLDialogElement,
  onDismiss: () => void = (): void => {
    dialog.close();
  },
): void {
  // Browsers close a modal dialog on Esc by themselves; handling it here as
  // well keeps that requirement visible and independent of the default
  dialog.addEventListener('keydown', (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') {
      return;
    }

    event.preventDefault();
    onDismiss();
  });

  // Other ways the browser closes a dialog, such as the Back gesture of a
  // phone, take the same way
  dialog.addEventListener('cancel', (event: Event): void => {
    event.preventDefault();
    onDismiss();
  });

  // The dialog closes when both the press and the click are on the backdrop, so
  // selecting text inside the dialog and letting go outside keeps it open
  let isPressOnBackdrop = false;
  dialog.addEventListener('pointerdown', (event: PointerEvent): void => {
    isPressOnBackdrop = isOnBackdrop(dialog, event);
  });
  dialog.addEventListener('click', (event: MouseEvent): void => {
    if (isPressOnBackdrop && isOnBackdrop(dialog, event)) {
      onDismiss();
    }
    isPressOnBackdrop = false;
  });
}
