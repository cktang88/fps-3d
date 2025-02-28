import { System } from "../types";

// Define our input state type
export type InputState = {
  movement: {
    forward: number;
    right: number;
    up: number;
  };
  mouse: {
    x: number;
    y: number;
    deltaX: number;
    deltaY: number;
    buttons: number; // Store mouse button state
  };
  buttons: {
    jump: boolean;
    fire: boolean;
    reload: boolean;
    interact: boolean;
  };
  keys: {
    [key: string]: boolean;
  };
};

// Global input state that can be accessed by other systems
export const inputState: InputState = {
  movement: {
    forward: 0,
    right: 0,
    up: 0,
  },
  mouse: {
    x: 0,
    y: 0,
    deltaX: 0,
    deltaY: 0,
    buttons: 0,
  },
  buttons: {
    jump: false,
    fire: false,
    reload: false,
    interact: false,
  },
  keys: {},
};

// Event handlers defined outside the system
const handleKeyDown = (event: KeyboardEvent): void => {
  // Update key state
  inputState.keys[event.key] = true;

  // Prevent default browser behavior for certain keys
  if (
    [" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
  ) {
    event.preventDefault();
  }
};

const handleKeyUp = (event: KeyboardEvent): void => {
  // Update key state
  inputState.keys[event.key] = false;
};

const handleMouseMove = (event: MouseEvent): void => {
  // Store absolute position
  inputState.mouse.x = event.clientX;
  inputState.mouse.y = event.clientY;

  // Store delta since last update
  inputState.mouse.deltaX += event.movementX;
  inputState.mouse.deltaY += event.movementY;
};

const handleMouseDown = (event: MouseEvent): void => {
  // Store mouse button state
  inputState.mouse.buttons |= 1 << event.button;
  if (event.button === 0) {
    inputState.buttons.fire = true;
  }
};

const handleMouseUp = (event: MouseEvent): void => {
  // Clear mouse button state
  inputState.mouse.buttons &= ~(1 << event.button);
  if (event.button === 0) {
    inputState.buttons.fire = false;
  }
};

/**
 * System that handles input from keyboard and mouse
 */
export const inputSystem: System = {
  name: "input",

  init() {
    // Setup event listeners for keyboard
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Setup event listeners for mouse
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    console.log("Input system initialized");
  },

  update() {
    // Update movement values based on current key states
    // W/S keys for forward/backward
    inputState.movement.forward = 0;
    if (inputState.keys["w"] || inputState.keys["ArrowUp"]) {
      inputState.movement.forward = 1;
    }
    if (inputState.keys["s"] || inputState.keys["ArrowDown"]) {
      inputState.movement.forward -= 1;
    }

    // A/D keys for left/right
    inputState.movement.right = 0;
    if (inputState.keys["d"] || inputState.keys["ArrowRight"]) {
      inputState.movement.right = 1;
    }
    if (inputState.keys["a"] || inputState.keys["ArrowLeft"]) {
      inputState.movement.right -= 1;
    }

    // Space for jumping
    inputState.buttons.jump = Boolean(inputState.keys[" "]);

    // Left mouse button for firing (already set in handleMouseDown/Up)

    // Reset mouse delta values after processing
    inputState.mouse.deltaX = 0;
    inputState.mouse.deltaY = 0;
  },

  cleanup() {
    // Remove event listeners
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mousedown", handleMouseDown);
    window.removeEventListener("mouseup", handleMouseUp);

    console.log("Input system cleaned up");
  },
};
