export enum SwipeDirection {
  Previous = 'previous',
  Next = 'next',
}

export interface SwipeHandlers {
  // The pointer went down on the area
  readonly onPress?: () => void;
  // The pointer let go: with a direction after a swipe, without one otherwise
  readonly onRelease: (direction: SwipeDirection | undefined) => void;
}

// A pointer that moves farther than this is dragging, not pressing a card
const DRAG_THRESHOLD = 10;
// A drag at least this long is a swipe to the next or previous card
const SWIPE_DISTANCE = 50;

// Turns horizontal swipes on an area into previous and next steps, for touch
// and mouse alike. A drag does not also click the card it started on.
export function enableSwipe(area: HTMLElement, handlers: SwipeHandlers): void {
  let startX = 0;
  let distance = 0;
  let isPressed = false;
  let isDragging = false;

  area.addEventListener('pointerdown', (event: PointerEvent): void => {
    if (!event.isPrimary || event.button !== 0) {
      return;
    }
    isPressed = true;
    isDragging = false;
    startX = event.clientX;
    distance = 0;
    handlers.onPress?.();
  });

  area.addEventListener('pointermove', (event: PointerEvent): void => {
    if (!isPressed) {
      return;
    }
    distance = event.clientX - startX;
    if (isDragging || Math.abs(distance) <= DRAG_THRESHOLD) {
      return;
    }
    isDragging = true;
    area.setPointerCapture(event.pointerId);
  });

  // The browser sends the click right after the release, in the same task, so
  // the drag ends one task later: after that click, before any other
  const release = (direction: SwipeDirection | undefined): void => {
    if (!isPressed) {
      return;
    }
    isPressed = false;
    handlers.onRelease(direction);
    setTimeout((): void => {
      isDragging = false;
    });
  };

  area.addEventListener('pointerup', (): void => {
    const isSwipe: boolean = Math.abs(distance) >= SWIPE_DISTANCE;
    const direction: SwipeDirection = distance > 0 ? SwipeDirection.Previous : SwipeDirection.Next;
    release(isSwipe ? direction : undefined);
  });

  // The browser took the pointer over, for example to scroll the page
  area.addEventListener('pointercancel', (): void => {
    release(undefined);
  });

  // The click that ends a drag is stopped before it reaches a card
  area.addEventListener(
    'click',
    (event: MouseEvent): void => {
      if (isDragging) {
        event.stopPropagation();
      }
    },
    { capture: true },
  );
}
