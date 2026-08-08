import { parseAlgorithm, type Algorithm, type AlgorithmNode } from '@cubesmith/scrambler';

// Once you have a tree you can ask questions a regex cannot answer. The node
// union is small and closed — `move`, `pause`, `group`, `commutator`,
// `conjugate` — so a `switch` over `node.type` with no `default` arm is checked
// for exhaustiveness by the compiler: add a node type in a future release and
// this stops compiling instead of silently skipping it.
export function countMoves(algorithm: Algorithm): number {
  let total = 0;

  for (const node of algorithm.nodes) {
    total += movesIn(node);
  }

  return total;
}

function movesIn(node: AlgorithmNode): number {
  switch (node.type) {
    case 'move':
      return 1;
    case 'pause':
      return 0;
    // A repetition multiplies its body, and `amount` is signed — `(R U)'` is
    // `-1` — so the count needs its magnitude.
    case 'group':
      return countMoves(node.body) * Math.abs(node.amount);
    // `[A, B]` expands to `A B A' B'` and `[A: B]` to `A B A'`, so the move
    // count is 2a + 2b and 2a + b respectively. Expansion itself is not
    // something this package does for you — the tree keeps both halves and
    // building the expanded sequence is yours if you need it.
    case 'commutator':
      return (countMoves(node.a) * 2 + countMoves(node.b) * 2) * Math.abs(node.amount);
    case 'conjugate':
      return (countMoves(node.a) * 2 + countMoves(node.b)) * Math.abs(node.amount);
  }
}

// A `MoveNode` describes its layers as a closed range counted inwards from the
// face, and both ends are `null` when the notation did not write them — which
// is not the same as writing them. `R` is `null`/`null`, `Rw` is `null`/`2`,
// `3Rw` is `null`/`3`, `2-3Rw` is `2`/`3`.
export function describeWidth(algorithm: Algorithm): string[] {
  return algorithm.nodes.filter(isMove).map((move) => {
    if (move.outerLayer !== null) return `${move.family}: layers ${move.outerLayer}-${move.innerLayer}`;
    if (move.innerLayer !== null) return `${move.family}: outer ${move.innerLayer} layers`;
    return `${move.family}: one layer`;
  });
}

function isMove(node: AlgorithmNode): node is Extract<AlgorithmNode, { type: 'move' }> {
  return node.type === 'move';
}

export function walk() {
  console.log(countMoves(parseAlgorithm("R U R' U'"))); // 4
  console.log(countMoves(parseAlgorithm('(R U)3'))); // 6
  console.log(countMoves(parseAlgorithm('[R, U]'))); // 4
  console.log(countMoves(parseAlgorithm("[R: (U Rw U')2]"))); // 8

  console.log(describeWidth(parseAlgorithm('R Rw 3Rw 2-3Rw')));
  // ["R: one layer", "R: outer 2 layers", "R: outer 3 layers", "R: layers 2-3"]
}
