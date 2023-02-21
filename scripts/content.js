const toggleStates = {
  w: false,
  b: false,
};

document.addEventListener('keydown', e => {
  if (e.metaKey && e.shiftKey && e.key === 'o') {
    const color = getOpponentColor();
    if (toggleBoard(color, toggleStates[color])) {
      toggleStates[color] = !toggleStates[color];
    }
  }
  if (e.metaKey && e.shiftKey && e.key === 'k') {
    const color = getUserColor();
    if (toggleBoard(color, toggleStates[color])) {
      toggleStates[color] = !toggleStates[color];
    }
  }
});

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
 * [color(b|w)][name]
 * k = king
 * q = queen
 * r = rook
 * b = bishop
 * n = knight
 * p = pawn
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
  const threatBoard = getEmptyBoard(false);
  
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[0].length; x++) {
      const piece = board[y][x];       
      if (!piece || piece.color !== color) continue;
      
      const threatSquares = getThreatSquares(board, color, bottomColor, { x, y });
      for (const s of threatSquares) {
        threatBoard[s.y][s.x] = true;
      }
    }
  }

  return threatBoard;
}

function getThreatSquares(board, color, bottomColor, { x, y }) {
  const threatSquares = [];
  const pieceName = board[y][x].name;   

  if (pieceName === 'k') {
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
    moveSquares.filter(s => canThreaten(board, color, s)).forEach(s => {
      threatSquares.push(s);
    });
  }

  if (pieceName === 'q') {
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
      let pos = updater({ x, y });
      while (canThreaten(board, color, pos)) {
        threatSquares.push(pos);
        if (board[pos.y][pos.x]) break;
        pos = updater(pos);
      }
    }
  }

  if (pieceName === 'r') {
    const squareUpdaters = [
      ({ x, y }) => ({ x       , y: y - 1 }),
      ({ x, y }) => ({ x: x + 1, y        }),
      ({ x, y }) => ({ x       , y: y + 1 }),
      ({ x, y }) => ({ x: x - 1, y        }),
    ];
    for (const updater of squareUpdaters) {
      let pos = updater({ x, y });
      while (canThreaten(board, color, pos)) {
        threatSquares.push(pos);
        if (board[pos.y][pos.x]) break;
        pos = updater(pos);
      }
    }
  }
  
  if (pieceName === 'b') {
    const squareUpdaters = [
      ({ x, y }) => ({ x: x + 1, y: y - 1 }),
      ({ x, y }) => ({ x: x + 1, y: y + 1 }),
      ({ x, y }) => ({ x: x - 1, y: y + 1 }),
      ({ x, y }) => ({ x: x - 1, y: y - 1 }),
    ];
    for (const updater of squareUpdaters) {
      let pos = updater({ x, y });
      while (canThreaten(board, color, pos)) {
        threatSquares.push(pos);
        if (board[pos.y][pos.x]) break;
        pos = updater(pos);
      }
    }
  }

  if (pieceName === 'n') {
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
    moveSquares.filter(s => canThreaten(board, color, s)).forEach(s => {
      threatSquares.push(s);
    });
  }
  
  if (pieceName === 'p') {
    const moveSquares = color === bottomColor
      ? [{ x: x - 1, y: y - 1 }, { x: x + 1, y: y - 1 }]
      : [{ x: x - 1, y: y + 1 }, { x: x + 1, y: y + 1 }];
    moveSquares.filter(s => canThreaten(board, color, s)).forEach(s => {
      threatSquares.push(s);
    });
  }

  return threatSquares;
}

function canThreaten(board, color, { x, y }) {
  if (!isInBounds(board, { x, y })) return false;
  return board[y][x] === null || board[y][x].color !== color;
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

  for (let y = 0; y < threatBoard.length; y++) {
    for (let x = 0; x < threatBoard[0].length; x++) {
      if (!threatBoard[y][x]) continue;
      const markerNode = document.createElement('div');
      markerNode.classList.add(getMarkerClassName(color));
      markerNode.style.cssText += `
        width: ${markerLength}px;
        height: ${markerLength}px;
        position: absolute;
        top: 0;
        left: 0;
        background-color: ${color === userColor ? '#5f67fa' : '#de535e'};
        opacity: 1;
        transform: translate(${100 * x}%, ${100 * y}%);
      `;
      boardNode.appendChild(markerNode);
    }
  }
}

function getMarkerClassName(color) {
  return `${color}-threat-marker`;
}

// debug

function getBoardStr(board) {
  const pieceSymbolMap = {
    w: {
      k: '♔',
      q: '♕',
      r: '♖',
      b: '♗',
      n: '♘',
      p: '♙',
    },
    b: {
      k: '♚',
      q: '♛',
      r: '♜',
      b: '♝',
      n: '♞',
      p: '♟︎',
    },
  };
  return board.reduce((accBoard, row) => {
    const rowStr = row.reduce((accRow, piece) => (
      `${accRow} ${piece ? pieceSymbolMap[piece.color][piece.name] : '.'}`
    ), '');
    return accBoard + `${rowStr}\n`
  }, '');
}

function getThreatBoardStr(board) {
  return board.reduce((accBoard, row) => {
    const rowStr = row.reduce((accRow, threat) => (
      `${accRow} ${threat ? 'o' : '.'}`
    ), '');
    return accBoard + `${rowStr}\n`
  }, '');
}
