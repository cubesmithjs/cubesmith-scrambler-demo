import { serializeAlgorithm, type Algorithm, type AlgorithmNode } from '@cubesmith/scrambler';

/**
 * The parsed tree, rendered as a tree.
 *
 * The point of showing it at all: `parseAlgorithm` does not hand back a list of
 * tokens, it hands back structure. `[R: (U Rw U')2]` is one conjugate whose
 * second half is a repeated group — which is why inverting it can invert the
 * right half and leave the setup alone.
 *
 * Each node prints its own notation via `serializeAlgorithm({ nodes: [node] })`.
 * The package exports no single-node serializer, and writing one here would mean
 * re-deriving the spelling rules (`Rw` vs `2Rw`, when a prime is printed) that
 * the real one already owns.
 */
export function AlgorithmTree({ algorithm }: { readonly algorithm: Algorithm }) {
  if (algorithm.nodes.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        An empty algorithm — <code className="font-mono">nodes: []</code>. Empty input is valid, not
        an error.
      </p>
    );
  }

  return <NodeList nodes={algorithm.nodes} />;
}

function NodeList({ nodes }: { readonly nodes: readonly AlgorithmNode[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {nodes.map((node, index) => (
        // Two identical moves are legitimately two nodes with the same content,
        // so position is the only stable identity here.
        <li key={index} className="font-mono text-sm">
          <NodeRow node={node} />
        </li>
      ))}
    </ul>
  );
}

/** `amount` in the tree is signed and never zero: `R'` is -1, `(R U)2'` is -2. */
function amountLabel(amount: number): string {
  return `amount ${amount > 0 ? `+${amount}` : amount}`;
}

function NodeRow({ node }: { readonly node: AlgorithmNode }) {
  const token = serializeAlgorithm({ nodes: [node] });

  switch (node.type) {
    case 'move':
      return (
        <span>
          <span className="text-emerald-300">{token}</span>{' '}
          <span className="text-neutral-500">
            move · family {node.family} · {amountLabel(node.amount)} ·{' '}
            {node.outerLayer !== null
              ? `layers ${node.outerLayer}-${node.innerLayer}`
              : node.innerLayer !== null
                ? `inner ${node.innerLayer}`
                : 'single layer'}
          </span>
        </span>
      );

    case 'pause':
      return (
        <span>
          <span className="text-emerald-300">.</span>{' '}
          <span className="text-neutral-500">pause · carries no amount</span>
        </span>
      );

    case 'group':
      return (
        <div>
          <span className="text-sky-300">{token}</span>{' '}
          <span className="text-neutral-500">group · {amountLabel(node.amount)}</span>
          <Branch label="body">
            <NodeList nodes={node.body.nodes} />
          </Branch>
        </div>
      );

    case 'commutator':
    case 'conjugate':
      return (
        <div>
          <span className="text-sky-300">{token}</span>{' '}
          <span className="text-neutral-500">
            {node.type} · {amountLabel(node.amount)} ·{' '}
            {node.type === 'commutator' ? "expands to A B A' B'" : "expands to A B A'"}
            {' · '}kept unexpanded
          </span>
          <Branch label="A">
            <NodeList nodes={node.a.nodes} />
          </Branch>
          <Branch label="B">
            <NodeList nodes={node.b.nodes} />
          </Branch>
        </div>
      );
  }
}

function Branch({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <div className="mt-1.5 ml-3 border-l border-neutral-800 pl-3">
      <span className="text-xs text-neutral-600">{label}</span>
      <div className="mt-1">{children}</div>
    </div>
  );
}
