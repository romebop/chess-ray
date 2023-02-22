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
    const rowStr = row.reduce((accRow, threat) => {
      let symbol = '.';
      if (threat === 'threat') symbol = 'o';
      if (threat === 'attack') symbol = 'a';
      if (threat === 'defend') symbol = 'd';
      return `${accRow} ${symbol}`;
    }, '');
    return accBoard + `${rowStr}\n`
  }, '');
}
