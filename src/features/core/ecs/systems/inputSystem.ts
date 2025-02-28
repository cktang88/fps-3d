import { System } from "../types";
import { Vector2 } from 'three';

// Debugging enabled or disabled
const DEBUG = true;

function log(...args: any[]) {
  if (DEBUG) {
    console.log('[Input System]', ...args);
  }
}

// Input state interface
export interface InputState {
  // Movement input values (-1 to 1)
  movement: {
    forward: number;
    right: number;
    jump: boolean;
  };
  // Button states (pressed or not)
  buttons: {
    jump: boolean;
    sprint: boolean;
    slide: boolean;
    shoot: boolean;
    reload: boolean;
  };
  // Mouse state
  mouse: {
    position: Vector2;
    delta: Vector2;
    buttons: {
      left: boolean;
      right: boolean;
      middle: boolean;
    };
  };
  // Key states
  keys: Map<string, boolean>;
}

// Create default input state
export const inputState: InputState = {
  movement: {
    forward: 0,
    right: 0,
    jump: false,
  },
  buttons: {
    jump: false,
    sprint: false,
    slide: false,
    shoot: false,
    reload: false,
  },
  mouse: {
    position: new Vector2(),
    delta: new Vector2(),
    buttons: {
      left: false,
      right: false,
      middle: false,
    },
  },
  keys: new Map<string, boolean>(),
};

// Initialize input system
let initialized = false;

// Key mapping for movement
const keyMap = {
  KeyW: 'forward',
  KeyS: 'backward',
  KeyA: 'left',
  KeyD: 'right',
  ArrowUp: 'forward',
  ArrowDown: 'backward',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Space: 'jump',
  ShiftLeft: 'sprint',
  ControlLeft: 'slide',
  KeyR: 'reload',
};

// Initialize input system
export function initInputSystem() {
  if (initialized) {
    return;
  }

  // Set up listeners for keyboard events
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  
  // Set up listeners for mouse events
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  
  // Log initialization
  log('Input system initialized');
  initialized = true;
}

// Clean up input system
export function cleanupInputSystem() {
  if (!initialized) {
    return;
  }

  document.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('keyup', handleKeyUp);
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mousedown', handleMouseDown);
  document.removeEventListener('mouseup', handleMouseUp);
  
  // Reset input state
  resetInputState();
  
  log('Input system cleaned up');
  initialized = false;
}

// Reset input state to defaults
export function resetInputState() {
  inputState.movement.forward = 0;
  inputState.movement.right = 0;
  inputState.movement.jump = false;
  
  inputState.buttons.jump = false;
  inputState.buttons.sprint = false;
  inputState.buttons.slide = false;
  inputState.buttons.shoot = false;
  inputState.buttons.reload = false;
  
  inputState.mouse.delta.set(0, 0);
  inputState.mouse.buttons.left = false;
  inputState.mouse.buttons.right = false;
  inputState.mouse.buttons.middle = false;
  
  inputState.keys.clear();
  
  log('Input state reset');
}

// Handle key down events
function handleKeyDown(event: KeyboardEvent) {
  // Skip if we're typing in an input field
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return;
  }

  // Update key map
  inputState.keys.set(event.code, true);
  
  // Debug 
  if (DEBUG && Math.random() < 0.1) {
    log(`Key Down: ${event.code}`);
  }
  
  // Handle movement keys
  updateMovementFromKeys();
  
  // Handle special keys
  switch (event.code) {
    case 'Space':
      inputState.buttons.jump = true;
      inputState.movement.jump = true;
      break;
    case 'ShiftLeft':
    case 'Shift':
      inputState.buttons.sprint = true;
      break;
    case 'ControlLeft':
    case 'Control':
      inputState.buttons.slide = true;
      break;
    case 'KeyR':
      inputState.buttons.reload = true;
      break;
  }
}

// Handle key up events
function handleKeyUp(event: KeyboardEvent) {
  // Skip if we're typing in an input field
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return;
  }

  // Update key map
  inputState.keys.set(event.code, false);
  
  // Debug
  if (DEBUG && Math.random() < 0.1) {
    log(`Key Up: ${event.code}`);
  }
  
  // Handle movement keys
  updateMovementFromKeys();
  
  // Handle special keys
  switch (event.code) {
    case 'Space':
      inputState.buttons.jump = false;
      inputState.movement.jump = false;
      break;
    case 'ShiftLeft':
    case 'Shift':
      inputState.buttons.sprint = false;
      break;
    case 'ControlLeft':
    case 'Control':
      inputState.buttons.slide = false;
      break;
    case 'KeyR':
      inputState.buttons.reload = false;
      break;
  }
}

// Update movement values based on current key states
function updateMovementFromKeys() {
  // Reset movement values
  let forward = 0;
  let right = 0;
  
  // Forward/backward
  if (inputState.keys.get('KeyW') || inputState.keys.get('ArrowUp')) {
    forward = -1; // Negative is forward in three.js
  } else if (inputState.keys.get('KeyS') || inputState.keys.get('ArrowDown')) {
    forward = 1;
  }
  
  // Left/right
  if (inputState.keys.get('KeyA') || inputState.keys.get('ArrowLeft')) {
    right = -1;
  } else if (inputState.keys.get('KeyD') || inputState.keys.get('ArrowRight')) {
    right = 1;
  }
  
  // Update input state
  inputState.movement.forward = forward;
  inputState.movement.right = right;
  
  // Debug movement occasionally
  if (DEBUG && Math.random() < 0.05 && (forward !== 0 || right !== 0)) {
    log(`Movement: Forward=${forward}, Right=${right}`);
  }
}

// Handle mouse move events
function handleMouseMove(event: MouseEvent) {
  // Update mouse position
  inputState.mouse.position.set(event.clientX, event.clientY);
  
  // Update mouse delta
  inputState.mouse.delta.set(event.movementX, event.movementY);
  
  // Debug occasionally to avoid spam
  if (DEBUG && Math.random() < 0.01) {
    log(`Mouse move: position=${inputState.mouse.position.x},${inputState.mouse.position.y}, delta=${inputState.mouse.delta.x},${inputState.mouse.delta.y}`);
  }
}

// Handle mouse down events
function handleMouseDown(event: MouseEvent) {
  switch (event.button) {
    case 0: // Left button
      inputState.mouse.buttons.left = true;
      inputState.buttons.shoot = true;
      break;
    case 1: // Middle button
      inputState.mouse.buttons.middle = true;
      break;
    case 2: // Right button
      inputState.mouse.buttons.right = true;
      break;
  }
  
  if (DEBUG) {
    log(`Mouse down: button=${event.button}`);
  }
}

// Handle mouse up events
function handleMouseUp(event: MouseEvent) {
  switch (event.button) {
    case 0: // Left button
      inputState.mouse.buttons.left = false;
      inputState.buttons.shoot = false;
      break;
    case 1: // Middle button
      inputState.mouse.buttons.middle = false;
      break;
    case 2: // Right button
      inputState.mouse.buttons.right = false;
      break;
  }
  
  if (DEBUG) {
    log(`Mouse up: button=${event.button}`);
  }
}

// Initialize the input system when this module is loaded
initInputSystem();

/**
 * System that handles input from keyboard and mouse
 */
export const inputSystem: System = {
  name: "inputSystem",

  init() {
    logInput("Initializing input system");

    // Add event listeners
    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp, { passive: false });
    window.addEventListener("mousemove", handleMouseMove, { passive: false });
    window.addEventListener("mousedown", handleMouseDown, { passive: false });
    window.addEventListener("mouseup", handleMouseUp, { passive: false });
    window.addEventListener("contextmenu", handleContextMenu);

    // Prevent the browser from handling these keys
    window.addEventListener("keydown", (e) => {
      // Prevent browser from scrolling with space and arrow keys
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(e.code)) {
        e.preventDefault();
      }
    }, { passive: false });

    // Handle page visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        // Reset all inputs when page is not visible
        resetInputState();
        logInput("Page hidden - all inputs reset");
      }
    });

    logInput("Input system initialized successfully");
  },

  update() {
    // Mouse deltas should be reset each frame
    // We're choosing NOT to reset them here to allow them to be used
    // by other systems during the frame. They'll be overwritten by
    // the next mousemove event.

    // Handle button states that might be held
    inputState.buttons.shoot = inputState.mouse.buttons.left;
  },

  cleanup() {
    // Remove event listeners
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mousedown", handleMouseDown);
    window.removeEventListener("mouseup", handleMouseUp);
    window.removeEventListener("contextmenu", handleContextMenu);

    logInput("Input system cleaned up");
  }
};

// Helper function to reset all inputs
function resetAllInputs() {
  inputState.movement.forward = 0;
  inputState.movement.right = 0;
  inputState.movement.jump = false;
  inputState.mouse.delta.set(0, 0);
  inputState.mouse.buttons.left = false;
  inputState.mouse.buttons.right = false;
  inputState.mouse.buttons.middle = false;
  
  // Reset all button states
  Object.keys(inputState.buttons).forEach(key => {
    (inputState.buttons as any)[key] = false;
  });
  
  // Reset all key states
  inputState.keys.clear();
}

function handleContextMenu(event: MouseEvent): void {
  // Prevent context menu
  event.preventDefault();
}
