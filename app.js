/**
 * Basic Calculator in C — Interactive Web & Terminal Logic
 * Mirrors the exact logic of main.c with real-time state synchronization
 */

const C_SOURCE_CODE = `#include <stdio.h>

int main() {
    char op;
    double a, b, result;

    printf("Enter operator (+ - * /): ");
    scanf("%c", &op);

    printf("Enter two numbers: ");
    scanf("%lf %lf", &a, &b);

    if (op == '+')
        result = a + b;
    else if (op == '-')
        result = a - b;
    else if (op == '*')
        result = a * b;
    else if (op == '/')
        result = a / b;
    else {
        printf("Invalid operator");
        return 0;
    }

    printf("Result: %.2lf", result);
    return 0;
}`;

// Application State
const state = {
  currentInput: '0',
  previousInput: null,
  activeOperator: null,
  waitingForSecondOperand: false,
  soundEnabled: true,
  history: [],
  // Terminal emulator state
  terminalStep: 'OP', // 'OP' -> 'NUM1' -> 'NUM2' -> 'DONE'
  termOp: null,
  termA: null,
  termB: null
};

// Web Audio API Synth for realistic subtle click sound
let audioCtx = null;
function playClickSound(freq = 440, type = 'sine', duration = 0.04) {
  if (!state.soundEnabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    // audio context might be blocked by browser policy until interaction
  }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  renderSyntaxHighlightedCode();
  setupTabSwitcher();
  setupKeypadListeners();
  setupKeyboardSupport();
  setupTerminalEmulator();
  setupHistory();
  setupCopyCode();
  setupSoundToggle();
  updateTraceDisplay();
});

/* ==========================================================================
   Code Rendering & Line Highlighting
   ========================================================================== */
function renderSyntaxHighlightedCode() {
  const codeContentEl = document.getElementById('c-code-content');
  if (!codeContentEl) return;

  const lines = C_SOURCE_CODE.split('\n');
  const html = lines.map((line, index) => {
    const lineNum = index + 1;
    const highlighted = highlightCLine(line);
    return `<span class="code-line" id="code-line-${lineNum}"><span class="line-num">${lineNum}</span>${highlighted}</span>`;
  }).join('');

  codeContentEl.innerHTML = html;
}

function highlightCLine(line) {
  let res = escapeHtml(line);
  // Strings
  res = res.replace(/(".*?")/g, '<span class="tok-str">$1</span>');
  // Includes
  res = res.replace(/#include &lt;stdio.h&gt;/, '<span class="tok-kw">#include</span> &lt;<span class="tok-type">stdio.h</span>&gt;');
  // Keywords
  res = res.replace(/\b(int|char|double|return|if|else)\b/g, '<span class="tok-kw">$1</span>');
  // Functions
  res = res.replace(/\b(printf|scanf|main)\b/g, '<span class="tok-fn">$1</span>');
  // Numbers
  res = res.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="tok-num">$1</span>');
  return res;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightCodeLines(lineNumbers) {
  document.querySelectorAll('.code-line.active-line').forEach(el => el.classList.remove('active-line'));
  lineNumbers.forEach(num => {
    const el = document.getElementById(`code-line-${num}`);
    if (el) el.classList.add('active-line');
  });
}

/* ==========================================================================
   Tab View Switcher (Modern vs Terminal)
   ========================================================================== */
function setupTabSwitcher() {
  const modernTab = document.getElementById('tab-modern');
  const terminalTab = document.getElementById('tab-terminal');
  const modernView = document.getElementById('modern-view');
  const terminalView = document.getElementById('terminal-view');

  modernTab.addEventListener('click', () => {
    modernTab.classList.add('active');
    modernTab.setAttribute('aria-selected', 'true');
    terminalTab.classList.remove('active');
    terminalTab.setAttribute('aria-selected', 'false');

    modernView.classList.add('active-view');
    terminalView.classList.remove('active-view');
    playClickSound(520);
  });

  terminalTab.addEventListener('click', () => {
    terminalTab.classList.add('active');
    terminalTab.setAttribute('aria-selected', 'true');
    modernTab.classList.remove('active');
    modernTab.setAttribute('aria-selected', 'false');

    terminalView.classList.add('active-view');
    modernView.classList.remove('active-view');
    playClickSound(420);
    setTimeout(() => {
      document.getElementById('term-user-input')?.focus();
    }, 50);
  });
}

/* ==========================================================================
   Modern Calculator Logic
   ========================================================================== */
function setupKeypadListeners() {
  const displayVal = document.getElementById('calc-display');
  const displayHist = document.getElementById('calc-history');
  const currOpEl = document.getElementById('calc-curr-op');

  document.querySelectorAll('.key-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const num = btn.getAttribute('data-num');
      const op = btn.getAttribute('data-op');
      const action = btn.getAttribute('data-action');

      if (num !== null) {
        inputDigit(num);
        playClickSound(380);
      } else if (op !== null) {
        handleOperator(op);
        playClickSound(480);
      } else if (action) {
        handleAction(action);
      }
    });
  });
}

function inputDigit(digit) {
  if (state.waitingForSecondOperand) {
    state.currentInput = digit;
    state.waitingForSecondOperand = false;
  } else {
    state.currentInput = state.currentInput === '0' ? digit : state.currentInput + digit;
  }
  updateCalcDisplay();
  
  if (state.activeOperator) {
    highlightCodeLines([11, 12]); // scanf b
    updateTraceDisplay(state.activeOperator, state.previousInput, state.currentInput, null, 'Reading operand `b`...');
  } else {
    highlightCodeLines([11, 12]); // scanf a
    updateTraceDisplay(null, state.currentInput, null, null, 'Reading operand `a`...');
  }
}

function inputDecimal() {
  if (state.waitingForSecondOperand) {
    state.currentInput = '0.';
    state.waitingForSecondOperand = false;
  } else if (!state.currentInput.includes('.')) {
    state.currentInput += '.';
  }
  updateCalcDisplay();
}

function handleOperator(nextOp) {
  const inputVal = parseFloat(state.currentInput);

  if (state.activeOperator && state.waitingForSecondOperand) {
    state.activeOperator = nextOp;
    updateCalcDisplay();
    return;
  }

  if (state.previousInput === null && !isNaN(inputVal)) {
    state.previousInput = inputVal;
  } else if (state.activeOperator) {
    const result = calculate(state.previousInput, inputVal, state.activeOperator);
    state.currentInput = String(result);
    state.previousInput = result;
  }

  state.activeOperator = nextOp;
  state.waitingForSecondOperand = true;
  updateCalcDisplay();
  
  highlightCodeLines([7, 8]); // scanf operator
  updateTraceDisplay(nextOp, state.previousInput, null, null, `Operator '${nextOp}' registered.`);
}

function calculate(a, b, op) {
  let res = 0;
  let lines = [];
  if (op === '+') {
    res = a + b;
    lines = [14, 15];
  } else if (op === '-') {
    res = a - b;
    lines = [16, 17];
  } else if (op === '*') {
    res = a * b;
    lines = [18, 19];
  } else if (op === '/') {
    if (b === 0) {
      res = NaN;
      lines = [20, 21];
    } else {
      res = a / b;
      lines = [20, 21];
    }
  }

  // Format like C %.2lf
  const formattedRes = isNaN(res) ? 'Error' : Number(res.toFixed(2));
  highlightCodeLines(lines.concat([26]));
  return formattedRes;
}

function handleAction(action) {
  if (action === 'clear') {
    state.currentInput = '0';
    state.previousInput = null;
    state.activeOperator = null;
    state.waitingForSecondOperand = false;
    updateCalcDisplay();
    highlightCodeLines([3, 4, 5]);
    updateTraceDisplay(null, 0, 0, 0, 'Calculator reset. Memory initialized.');
    playClickSound(300, 'square');
  } else if (action === 'backspace') {
    if (state.currentInput.length > 1) {
      state.currentInput = state.currentInput.slice(0, -1);
    } else {
      state.currentInput = '0';
    }
    updateCalcDisplay();
    playClickSound(320);
  } else if (action === 'negate') {
    if (state.currentInput !== '0') {
      state.currentInput = state.currentInput.startsWith('-')
        ? state.currentInput.slice(1)
        : '-' + state.currentInput;
      updateCalcDisplay();
    }
    playClickSound(350);
  } else if (action === 'decimal') {
    inputDecimal();
    playClickSound(360);
  } else if (action === 'equals') {
    if (!state.activeOperator || state.previousInput === null) return;
    const a = state.previousInput;
    const b = parseFloat(state.currentInput);
    const op = state.activeOperator;
    const result = calculate(a, b, op);

    const historyEntry = {
      a,
      b,
      op,
      result
    };
    addHistoryItem(historyEntry);

    document.getElementById('calc-history').innerText = `${a} ${op} ${b} =`;
    state.currentInput = String(result);
    state.previousInput = null;
    state.activeOperator = null;
    state.waitingForSecondOperand = true;
    updateCalcDisplay();

    updateTraceDisplay(op, a, b, result, `Executed ${a} ${op} ${b} -> Result: ${result} (printf %.2lf)`);
    playClickSound(650, 'triangle', 0.08);
  }
}

function updateCalcDisplay() {
  const displayVal = document.getElementById('calc-display');
  const currOpEl = document.getElementById('calc-curr-op');
  const opIndicator = document.getElementById('operator-indicator');

  displayVal.innerText = state.currentInput;
  currOpEl.innerText = state.activeOperator ? state.activeOperator : '';

  // Update op buttons active state
  document.querySelectorAll('.op-key').forEach(btn => {
    if (btn.getAttribute('data-op') === state.activeOperator) {
      btn.classList.add('active-op');
    } else {
      btn.classList.remove('active-op');
    }
  });

  if (state.activeOperator) {
    opIndicator.innerText = `OP: '${state.activeOperator}'`;
    opIndicator.style.borderColor = 'rgba(56, 189, 248, 0.4)';
    opIndicator.style.color = 'var(--accent-c-blue)';
  } else {
    opIndicator.innerText = 'READY';
    opIndicator.style.borderColor = 'rgba(16, 185, 129, 0.35)';
    opIndicator.style.color = 'var(--accent-emerald)';
  }
}

/* Keyboard Support */
function setupKeyboardSupport() {
  window.addEventListener('keydown', (e) => {
    // If typing in terminal input, don't trigger modern keypad
    if (document.activeElement === document.getElementById('term-user-input')) {
      return;
    }

    if (e.key >= '0' && e.key <= '9') {
      inputDigit(e.key);
      playClickSound(380);
    } else if (['+', '-', '*', '/'].includes(e.key)) {
      handleOperator(e.key);
      playClickSound(480);
    } else if (e.key === '.' || e.key === ',') {
      inputDecimal();
      playClickSound(360);
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      handleAction('equals');
    } else if (e.key === 'Backspace') {
      handleAction('backspace');
    } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
      handleAction('clear');
    }
  });
}

/* ==========================================================================
   C Terminal Emulator Logic
   ========================================================================== */
function setupTerminalEmulator() {
  const inputEl = document.getElementById('term-user-input');
  const promptText = document.getElementById('term-prompt-text');
  const logsEl = document.getElementById('term-logs');
  const restartBtn = document.getElementById('terminal-restart-btn');

  function appendLog(lineHtml) {
    const div = document.createElement('div');
    div.className = 'term-line';
    div.innerHTML = lineHtml;
    logsEl.appendChild(div);
    const screen = document.getElementById('term-screen');
    screen.scrollTop = screen.scrollHeight;
  }

  function resetTerminal() {
    state.terminalStep = 'OP';
    state.termOp = null;
    state.termA = null;
    state.termB = null;
    logsEl.innerHTML = '';
    promptText.innerText = 'Enter operator (+ - * /): ';
    inputEl.value = '';
    inputEl.disabled = false;
    inputEl.focus();
    highlightCodeLines([7, 8]);
    updateTraceDisplay(null, 0, 0, 0, 'Terminal process started. Waiting for operator.');
  }

  restartBtn.addEventListener('click', resetTerminal);

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = inputEl.value.trim();
      inputEl.value = '';

      if (val.toLowerCase() === 'restart' || val.toLowerCase() === 'clear') {
        resetTerminal();
        return;
      }

      if (state.terminalStep === 'OP') {
        appendLog(`<span class="term-amber">Enter operator (+ - * /): </span><span class="term-cyan">${escapeHtml(val)}</span>`);
        if (!['+', '-', '*', '/'].includes(val)) {
          appendLog(`<span class="term-rose">Invalid operator</span>`);
          appendLog(`<span class="term-dim">Process returned 0 (0x0)</span>`);
          promptText.innerText = 'Press Enter or Reset to run again...';
          inputEl.disabled = true;
          state.terminalStep = 'DONE';
          highlightCodeLines([22, 23]);
          updateTraceDisplay(val, 'Invalid', 'Invalid', 'N/A', 'Invalid operator entered -> branch else reached.');
          return;
        }

        state.termOp = val;
        state.terminalStep = 'NUMS';
        promptText.innerText = 'Enter two numbers: ';
        highlightCodeLines([10, 11]);
        updateTraceDisplay(val, null, null, null, `Operator '${val}' stored in char op.`);
      } else if (state.terminalStep === 'NUMS') {
        appendLog(`<span class="term-amber">Enter two numbers: </span><span class="term-cyan">${escapeHtml(val)}</span>`);
        
        // Split numbers (handles space or comma separation)
        const parts = val.split(/[\s,]+/).filter(Boolean);
        if (parts.length < 2) {
          appendLog(`<span class="term-rose">Error: Expected 2 numbers separated by a space (e.g. 15 4)</span>`);
          promptText.innerText = 'Enter two numbers: ';
          return;
        }

        const a = parseFloat(parts[0]);
        const b = parseFloat(parts[1]);

        if (isNaN(a) || isNaN(b)) {
          appendLog(`<span class="term-rose">Error: Invalid floating point input for scanf ("%lf %lf")</span>`);
          promptText.innerText = 'Enter two numbers: ';
          return;
        }

        state.termA = a;
        state.termB = b;
        const op = state.termOp;
        let result = 0;

        if (op === '+') result = a + b;
        else if (op === '-') result = a - b;
        else if (op === '*') result = a * b;
        else if (op === '/') {
          if (b === 0) result = Infinity;
          else result = a / b;
        }

        const formatted = result.toFixed(2);
        appendLog(`<span class="term-green">Result: ${formatted}</span>`);
        appendLog(`<span class="term-dim">Process finished with exit code 0</span>`);
        
        addHistoryItem({ a, b, op, result: parseFloat(formatted) });
        updateTraceDisplay(op, a, b, parseFloat(formatted), `Calculation complete: printf("Result: %.2lf", ${formatted})`);

        promptText.innerText = 'Execution done. Type "restart" or press Enter: ';
        state.terminalStep = 'DONE';
      } else if (state.terminalStep === 'DONE') {
        resetTerminal();
      }
    }
  });
}

/* ==========================================================================
   State & Variable Trace Inspector
   ========================================================================== */
function updateTraceDisplay(op = state.activeOperator, a = state.previousInput, b = null, res = null, statusMsg = null) {
  const traceOp = document.getElementById('trace-op');
  const traceA = document.getElementById('trace-a');
  const traceB = document.getElementById('trace-b');
  const traceRes = document.getElementById('trace-res');
  const statusEl = document.getElementById('trace-status-message');

  if (traceOp) traceOp.innerText = op !== null && op !== undefined ? `'${op}'` : 'None';
  if (traceA) traceA.innerText = a !== null && a !== undefined ? Number(a).toFixed(2) : '0.00';
  if (traceB) traceB.innerText = b !== null && b !== undefined ? Number(b).toFixed(2) : '0.00';
  if (traceRes) traceRes.innerText = res !== null && res !== undefined ? Number(res).toFixed(2) : '0.00';

  if (statusMsg && statusEl) {
    statusEl.innerText = statusMsg;
  }
}

/* ==========================================================================
   History Tracking
   ========================================================================== */
function setupHistory() {
  const clearBtn = document.getElementById('clear-history-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      state.history = [];
      renderHistoryList();
    });
  }
}

function addHistoryItem(item) {
  state.history.unshift(item);
  if (state.history.length > 10) state.history.pop();
  renderHistoryList();
}

function renderHistoryList() {
  const listEl = document.getElementById('history-items');
  if (!listEl) return;

  if (state.history.length === 0) {
    listEl.innerHTML = '<div class="history-empty">No calculations yet. Start calculating to record history!</div>';
    return;
  }

  listEl.innerHTML = state.history.map((h, i) => `
    <div class="history-item" onclick="loadHistoryItem(${i})">
      <span class="hist-expr">${h.a} ${h.op} ${h.b}</span>
      <span class="hist-res">= ${h.result}</span>
    </div>
  `).join('');
}

window.loadHistoryItem = function(index) {
  const item = state.history[index];
  if (!item) return;
  state.currentInput = String(item.result);
  state.previousInput = null;
  state.activeOperator = null;
  state.waitingForSecondOperand = true;
  updateCalcDisplay();
  updateTraceDisplay(item.op, item.a, item.b, item.result, `Loaded result ${item.result} from history.`);
  playClickSound(450);
};

/* ==========================================================================
   Utilities: Copy C Code & Sound Switch
   ========================================================================== */
function setupCopyCode() {
  const copyBtn = document.getElementById('copy-c-btn');
  const copyText = document.getElementById('copy-c-text');
  if (!copyBtn) return;

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(C_SOURCE_CODE).then(() => {
      copyText.innerText = 'Copied to Clipboard!';
      setTimeout(() => {
        copyText.innerText = 'Copy C Code';
      }, 2000);
    });
  });
}

function setupSoundToggle() {
  const soundBtn = document.getElementById('sound-toggle-btn');
  const iconOn = document.getElementById('sound-icon-on');
  const iconOff = document.getElementById('sound-icon-off');

  soundBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    if (state.soundEnabled) {
      iconOn.classList.remove('hidden');
      iconOff.classList.add('hidden');
      playClickSound(600);
    } else {
      iconOn.classList.add('hidden');
      iconOff.classList.remove('hidden');
    }
  });
}
