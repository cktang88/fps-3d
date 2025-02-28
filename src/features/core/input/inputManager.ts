type InputCallback = () => void;
type InputCallbackWithValue = (value: number) => void;
type PointerLockCallback = (isLocked: boolean) => void;

/**
 * Manages keyboard and mouse input
 */
export class InputManager {
  private keys: Map<string, boolean> = new Map();
  private keyPressCallbacks: Map<string, InputCallback[]> = new Map();
  private keyReleaseCallbacks: Map<string, InputCallback[]> = new Map();
  private mouseCallbacks: Map<string, InputCallbackWithValue[]> = new Map();
  private pointerLockCallbacks: PointerLockCallback[] = [];

  private mouseLocked: boolean = false;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private mouseDeltaX: number = 0;
  private mouseDeltaY: number = 0;

  constructor(target: HTMLElement = document.body) {
    // Set up keyboard listeners
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);

    // Set up mouse move listener
    window.addEventListener("mousemove", this.handleMouseMove);

    // Set up pointer lock change listener
    document.addEventListener(
      "pointerlockchange",
      this.handlePointerLockChange
    );

    // Set up mouse button listeners
    window.addEventListener("mousedown", this.handleMouseDown);
    window.addEventListener("mouseup", this.handleMouseUp);

    // Set up touch events for mobile
    target.addEventListener("touchstart", this.handleTouchStart);
    target.addEventListener("touchmove", this.handleTouchMove);
    target.addEventListener("touchend", this.handleTouchEnd);
  }

  /**
   * Clean up all event listeners
   */
  cleanup(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener(
      "pointerlockchange",
      this.handlePointerLockChange
    );
    window.removeEventListener("mousedown", this.handleMouseDown);
    window.removeEventListener("mouseup", this.handleMouseUp);

    const target = document.body;
    target.removeEventListener("touchstart", this.handleTouchStart);
    target.removeEventListener("touchmove", this.handleTouchMove);
    target.removeEventListener("touchend", this.handleTouchEnd);
  }

  /**
   * Check if a key is pressed
   */
  isKeyPressed(key: string): boolean {
    return this.keys.get(key.toLowerCase()) || false;
  }

  /**
   * Register a callback for when a key is pressed
   */
  onKeyPress(key: string, callback: InputCallback): void {
    const lowercaseKey = key.toLowerCase();
    if (!this.keyPressCallbacks.has(lowercaseKey)) {
      this.keyPressCallbacks.set(lowercaseKey, []);
    }
    this.keyPressCallbacks.get(lowercaseKey)?.push(callback);
  }

  /**
   * Register a callback for when a key is released
   */
  onKeyRelease(key: string, callback: InputCallback): void {
    const lowercaseKey = key.toLowerCase();
    if (!this.keyReleaseCallbacks.has(lowercaseKey)) {
      this.keyReleaseCallbacks.set(lowercaseKey, []);
    }
    this.keyReleaseCallbacks.get(lowercaseKey)?.push(callback);
  }

  /**
   * Register a callback for mouse events
   */
  onMouse(
    event: "move" | "click" | "down" | "up" | "wheel",
    callback: InputCallbackWithValue
  ): void {
    if (!this.mouseCallbacks.has(event)) {
      this.mouseCallbacks.set(event, []);
    }
    this.mouseCallbacks.get(event)?.push(callback);
  }

  /**
   * Register a callback for pointer lock changes
   */
  onPointerLockChange(callback: PointerLockCallback): void {
    this.pointerLockCallbacks.push(callback);
  }

  /**
   * Lock the pointer for FPS style mouse look
   */
  lockPointer(element: HTMLElement = document.body): void {
    if (!this.mouseLocked) {
      element.requestPointerLock();
    }
  }

  /**
   * Unlock the pointer
   */
  unlockPointer(): void {
    if (this.mouseLocked) {
      document.exitPointerLock();
    }
  }

  /**
   * Get the current mouse position
   */
  getMousePosition(): { x: number; y: number } {
    return { x: this.mouseX, y: this.mouseY };
  }

  /**
   * Get the mouse delta (change in position)
   */
  getMouseDelta(): { x: number; y: number } {
    const delta = { x: this.mouseDeltaX, y: this.mouseDeltaY };
    // Reset deltas after reading
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    return delta;
  }

  /**
   * Check if the pointer is locked
   */
  isPointerLocked(): boolean {
    return this.mouseLocked;
  }

  /**
   * Handle key down events
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();

    // Only trigger callbacks if the key wasn't already pressed
    const isNewPress = !this.keys.get(key);

    // Update key state
    this.keys.set(key, true);

    if (isNewPress) {
      const callbacks = this.keyPressCallbacks.get(key);
      if (callbacks) {
        callbacks.forEach((callback) => callback());
      }
    }
  };

  /**
   * Handle key up events
   */
  private handleKeyUp = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();

    // Update key state
    this.keys.set(key, false);

    const callbacks = this.keyReleaseCallbacks.get(key);
    if (callbacks) {
      callbacks.forEach((callback) => callback());
    }
  };

  /**
   * Handle mouse move events
   */
  private handleMouseMove = (event: MouseEvent): void => {
    // Update absolute position
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;

    // Update deltas when pointer is locked
    if (this.mouseLocked) {
      this.mouseDeltaX += event.movementX;
      this.mouseDeltaY += event.movementY;
    }

    // Trigger callbacks
    const callbacks = this.mouseCallbacks.get("move");
    if (callbacks) {
      callbacks.forEach((callback) => callback(event.movementX));
      callbacks.forEach((callback) => callback(event.movementY));
    }
  };

  /**
   * Handle mouse down events
   */
  private handleMouseDown = (event: MouseEvent): void => {
    // Trigger callbacks
    const callbacks = this.mouseCallbacks.get("down");
    if (callbacks) {
      callbacks.forEach((callback) => callback(event.button));
    }

    // Also trigger click callbacks
    const clickCallbacks = this.mouseCallbacks.get("click");
    if (clickCallbacks) {
      clickCallbacks.forEach((callback) => callback(event.button));
    }
  };

  /**
   * Handle mouse up events
   */
  private handleMouseUp = (event: MouseEvent): void => {
    // Trigger callbacks
    const callbacks = this.mouseCallbacks.get("up");
    if (callbacks) {
      callbacks.forEach((callback) => callback(event.button));
    }
  };

  /**
   * Handle pointer lock change
   */
  private handlePointerLockChange = (): void => {
    this.mouseLocked = document.pointerLockElement !== null;

    // Reset deltas when locking/unlocking
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;

    // Trigger callbacks
    this.pointerLockCallbacks.forEach((callback) => callback(this.mouseLocked));
  };

  /**
   * Handle touch start
   */
  private handleTouchStart = (event: TouchEvent): void => {
    event.preventDefault();

    if (event.touches.length > 0) {
      this.mouseX = event.touches[0].clientX;
      this.mouseY = event.touches[0].clientY;

      // Simulate mouse down
      const callbacks = this.mouseCallbacks.get("down");
      if (callbacks) {
        callbacks.forEach((callback) => callback(0)); // Left click
      }
    }
  };

  /**
   * Handle touch move
   */
  private handleTouchMove = (event: TouchEvent): void => {
    event.preventDefault();

    if (event.touches.length > 0) {
      const deltaX = event.touches[0].clientX - this.mouseX;
      const deltaY = event.touches[0].clientY - this.mouseY;

      this.mouseDeltaX += deltaX;
      this.mouseDeltaY += deltaY;

      this.mouseX = event.touches[0].clientX;
      this.mouseY = event.touches[0].clientY;

      // Simulate mouse move
      const callbacks = this.mouseCallbacks.get("move");
      if (callbacks) {
        callbacks.forEach((callback) => callback(deltaX));
        callbacks.forEach((callback) => callback(deltaY));
      }
    }
  };

  /**
   * Handle touch end
   */
  private handleTouchEnd = (event: TouchEvent): void => {
    event.preventDefault();

    // Simulate mouse up
    const callbacks = this.mouseCallbacks.get("up");
    if (callbacks) {
      callbacks.forEach((callback) => callback(0)); // Left click
    }
  };
}
