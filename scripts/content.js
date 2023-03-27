const toggleStates = {
  w: false,
  b: false,
};

let opponentHotkey;
let userHotkey;
chrome.storage.sync.get({
  opponentHotkey: ['Meta', 'Shift', 'o'],
  userHotkey: ['Meta', 'Shift', 'k'],
}).then(items => {
  opponentHotkey = items.opponentHotkey;
  userHotkey = items.userHotkey;
});

const pressedKeys = [];

document.addEventListener('keydown', e => {
  if (pressedKeys.includes(e.key)) return;
  pressedKeys.push(e.key);

  if (opponentHotkey.every(k => pressedKeys.includes(k))) {
    const color = getOpponentColor();
    if (toggleBoard(color, toggleStates[color])) {
      toggleStates[color] = !toggleStates[color];
    }
  }
  
  if (userHotkey.every(k => pressedKeys.includes(k))) {
    const color = getUserColor();
    if (toggleBoard(color, toggleStates[color])) {
      toggleStates[color] = !toggleStates[color];
    }
  }
});

document.addEventListener('keyup', e => {
  console.log(`keyup for ${e.key} triggered`);
  const idx = pressedKeys.findIndex(k => k === e.key);
  if (idx < 0) return;
  pressedKeys.splice(idx, 1);
});

setInterval(() => {
  console.log(pressedKeys);
}, 2000);

function getUserColor() {
  return document.querySelector('.coordinates').firstElementChild.textContent === '8' ? 'w' : 'b';
}

function getOpponentColor() {
  return getUserColor() === 'w' ? 'b' : 'w';
}

/*
 * css class name conventions:
 *
 * piece
 *
 * [color(w|b)][name(k|q|r|b|n|p)]
 * 
 * square-[column(1-8)][row(1-8)] 
 */

function toggleBoard(color, isOn) {
  const boardNode = document.querySelector('chess-board');
  if (!boardNode) return false;

  // get 2D Array model of board
  const board = getBoard(boardNode, getUserColor());
  // console.log(getBoardStr(board));

  if (isOn) {
    removeMarkers(boardNode, color);
  } else {
    const threatBoard = getThreatBoard(board, color, getUserColor());
    // console.log(getThreatBoardStr(threatBoard));
    addMarkers(boardNode, color, threatBoard);
  }

  return true;
}

function getBoard(boardNode, bottomColor) {
  const board = getEmptyBoard(null);

  for (const node of boardNode.childNodes) {
    if (
      node.nodeType !== Node.ELEMENT_NODE
      || !node.classList.contains('piece')
    ) continue;

    const pieceRegex = /^(?<color>(w|b))(?<name>(r|n|b|k|q|p))$/;
    const pieceStr = node.className.split(' ').find(s => pieceRegex.test(s));
    const { color, name } = pieceStr.match(pieceRegex).groups;
    piece = { color, name };

    const positionRegex = /^square-(?<colStr>\d)(?<rowStr>\d)$/;
    const positionStr = node.className.split(' ').find(s => positionRegex.test(s));
    const { rowStr, colStr } = positionStr.match(positionRegex).groups;
    const [row, col] = getIndices(rowStr, colStr, bottomColor);
  
    board[row][col] = piece;
  }

  return board;
}

function getEmptyBoard(initVal) {
  return Array(8).fill(null).map(() => Array(8).fill(initVal));
}

function getIndices(rowStr, colStr, bottomColor) {
  return bottomColor === 'w'
    ? [8 - Number(rowStr), Number(colStr) - 1]
    : [Number(rowStr) - 1, 8 - Number(colStr)];
}

function getThreatBoard(board, color, bottomColor) {
  // cell values: null, 'threat', 'attack', 'defend'
  const threatBoard = getEmptyBoard(null);
  
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[0].length; x++) {
      const piece = board[y][x];       
      if (!piece || piece.color !== color) continue;
      
      const threatSquares = getThreatSquares(board, color, bottomColor, { x, y });
      for (const s of threatSquares) {
        threatBoard[s.y][s.x] = 'threat';
      }
    }
  }

  for (let y = 0; y < threatBoard.length; y++) {
    for (let x = 0; x < threatBoard[0].length; x++) {
      if (!threatBoard[y][x] || !board[y][x]) continue;
      const piece = board[y][x];

      threatBoard[y][x] = piece.color === color ? 'defend' : 'attack';
    }
  }

  return threatBoard;
}

function getThreatSquares(board, color, bottomColor, { x, y }) {
  const threatSquares = [];
  const pieceName = board[y][x].name;   

  if (pieceName === 'k') { // king
    const moveSquares = [
      { x       , y: y - 1 },
      { x: x + 1, y: y - 1 },
      { x: x + 1, y        },
      { x: x + 1, y: y + 1 },
      { x       , y: y + 1 },
      { x: x - 1, y: y + 1 },
      { x: x - 1, y        },
      { x: x - 1, y: y - 1 },
    ];
    moveSquares.filter(square => isInBounds(board, square))
      .forEach(square => {
        threatSquares.push(square);
      });
  }

  if (pieceName === 'q') { // queen
    const squareUpdaters = [
      ({ x, y }) => ({ x       , y: y - 1 }),
      ({ x, y }) => ({ x: x + 1, y: y - 1 }),
      ({ x, y }) => ({ x: x + 1, y        }),
      ({ x, y }) => ({ x: x + 1, y: y + 1 }),
      ({ x, y }) => ({ x       , y: y + 1 }),
      ({ x, y }) => ({ x: x - 1, y: y + 1 }),
      ({ x, y }) => ({ x: x - 1, y        }),
      ({ x, y }) => ({ x: x - 1, y: y - 1 }),
    ];
    for (const updater of squareUpdaters) {
      let square = updater({ x, y });
      while (isInBounds(board, square)) {
        threatSquares.push(square);
        if (board[square.y][square.x]) break;
        square = updater(square);
      }
    }
  }

  if (pieceName === 'r') { // rook
    const squareUpdaters = [
      ({ x, y }) => ({ x       , y: y - 1 }),
      ({ x, y }) => ({ x: x + 1, y        }),
      ({ x, y }) => ({ x       , y: y + 1 }),
      ({ x, y }) => ({ x: x - 1, y        }),
    ];
    for (const updater of squareUpdaters) {
      let square = updater({ x, y });
      while (isInBounds(board, square)) {
        threatSquares.push(square);
        if (board[square.y][square.x]) break;
        square = updater(square);
      }
    }
  }
  
  if (pieceName === 'b') { // bishop
    const squareUpdaters = [
      ({ x, y }) => ({ x: x + 1, y: y - 1 }),
      ({ x, y }) => ({ x: x + 1, y: y + 1 }),
      ({ x, y }) => ({ x: x - 1, y: y + 1 }),
      ({ x, y }) => ({ x: x - 1, y: y - 1 }),
    ];
    for (const updater of squareUpdaters) {
      let square = updater({ x, y });
      while (isInBounds(board, square)) {
        threatSquares.push(square);
        if (board[square.y][square.x]) break;
        square = updater(square);
      }
    }
  }

  if (pieceName === 'n') { // knight
    const moveSquares = [
      { x: x + 1, y: y - 2 },
      { x: x + 2, y: y - 1 },
      { x: x + 2, y: y + 1 },
      { x: x + 1, y: y + 2 },
      { x: x - 1, y: y + 2 },
      { x: x - 2, y: y + 1 },
      { x: x - 2, y: y - 1 },
      { x: x - 1, y: y - 2 },
    ];
    moveSquares.filter(square => isInBounds(board, square))
      .forEach(square => {
        threatSquares.push(square);
      });
  }
  
  if (pieceName === 'p') { // pawn
    const moveSquares = color === bottomColor
      ? [{ x: x - 1, y: y - 1 }, { x: x + 1, y: y - 1 }]
      : [{ x: x - 1, y: y + 1 }, { x: x + 1, y: y + 1 }];
    moveSquares.filter(square => isInBounds(board, square))
      .forEach(square => {
        threatSquares.push(square);
      });
  }

  return threatSquares;
}

function isInBounds(board, { x, y }) {
  return x >= 0 && x < board[0].length && y >= 0 && y < board.length;
}

function removeMarkers(boardNode, color) {
  boardNode.querySelectorAll(`.${getMarkerClassName(color)}`)
    .forEach(markerNode => markerNode.remove());
}

function addMarkers(boardNode, color, threatBoard) {
  const markerLength = boardNode.querySelector('.piece').getBoundingClientRect().width;
  const userColor = getUserColor();
  const userColorHex = '#0095ff';
  const opponentColorHex = '#ec1313';

  for (let y = 0; y < threatBoard.length; y++) {
    for (let x = 0; x < threatBoard[0].length; x++) {
      if (!threatBoard[y][x]) continue;
      
      const markerNode = document.createElement('div');
      markerNode.classList.add('threat-marker');
      markerNode.classList.add(getMarkerClassName(color));
      markerNode.style.cssText += `
        width: ${markerLength}px;
        height: ${markerLength}px;
        transform: translate(${100 * x}%, ${100 * y}%);
      `;

      const filterNode = document.createElement('div');
      filterNode.classList.add('filter');
      filterNode.style.cssText += `
        width: ${markerLength}px;
        height: ${markerLength}px;
      `;
      markerNode.appendChild(filterNode);

      const backgroundNode = document.createElement('div');
      backgroundNode.classList.add('background');
      backgroundNode.style.cssText += `
        background-color: ${color === userColor ? userColorHex : opponentColorHex};
      `;
      markerNode.appendChild(backgroundNode);

      const glitchBorderContainerNode = document.createElement('div');
      glitchBorderContainerNode.classList.add('glitch-border-container');
      markerNode.appendChild(glitchBorderContainerNode);

      const glitchContainerNode = document.createElement('div');
      glitchContainerNode.classList.add('glitch-container');
      glitchContainerNode.style.cssText += `
        background-color: ${color === userColor ? userColorHex : opponentColorHex};
      `;
      glitchBorderContainerNode.appendChild(glitchContainerNode);

      if (threatBoard[y][x] !== 'threat') {
        const imgNode = document.createElement('img');
        const glitchImgNode = document.createElement('img');
        glitchImgNode.classList.add('glitch-image');
        imgNode.src = threatBoard[y][x] === 'attack'
          ? chrome.runtime.getURL('../assets/attack.svg')
          : chrome.runtime.getURL('../assets/defend.svg');
        glitchImgNode.src = threatBoard[y][x] === 'attack'
          ? chrome.runtime.getURL('../assets/attack.svg')
          : chrome.runtime.getURL('../assets/defend.svg');
        imgNode.style.cssText += `
          height: ${markerLength / 5}px;
        `;
        glitchImgNode.style.cssText += `
          height: ${markerLength / 5}px;
        `;
        backgroundNode.appendChild(imgNode);
        glitchContainerNode.appendChild(glitchImgNode);
      }
      
      boardNode.appendChild(markerNode);
    }
  }
}

function getMarkerClassName(color) {
  return `${color}-threat-marker`;
}