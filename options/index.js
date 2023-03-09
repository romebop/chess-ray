let pressedKeys = [];
let isHotkeySet = true;

const inputs = {
  opponent: document.querySelector('#opponent-hotkey-input'),
  user: document.querySelector('#user-hotkey-input'),
}

chrome.storage.sync.get({
  opponentHotkey: ['Meta', 'Shift', 'o'],
  userHotkey: ['Meta', 'Shift', 'k'],
}).then(items => {
  inputs.opponent.value = items.opponentHotkey.join(' + ');
  inputs.user.value = items.userHotkey.join(' + ');
});

inputs.opponent.addEventListener('keydown', onKeydown('opponent'));
inputs.opponent.addEventListener('keyup', onKeyup('opponent'));
inputs.user.addEventListener('keydown', onKeydown('user'));
inputs.user.addEventListener('keyup', onKeyup('user'));

function onKeydown(target) {
  return e => {
    e.preventDefault();
    if (pressedKeys.includes(e.key)) return;

    inputs[target].value = '';
    pressedKeys.push(e.key);
    isHotkeySet = false;
  };
}

function onKeyup(target) {
  return () => {
    if (isHotkeySet) return;

    chrome.storage.sync.set({ [`${target}Hotkey`]: [...pressedKeys] })
      .then(() => {
        const checkmark = document.getElementById(`${target}-checkmark`);
        checkmark.classList.add('show');
        setTimeout(() => {
          checkmark.classList.remove('show');
        }, 1000);
      });

    inputs[target].value = pressedKeys.join(' + ');
    pressedKeys = [];
    isHotkeySet = true;
  };
}
