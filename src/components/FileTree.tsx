/* Recursive file tree over the vault structure. Folders collapse/expand; files
   select by base name and show a dot when they have unsaved edits. */
import { useState } from 'react';
import type { VaultNode } from '../lib/vault';
import { baseName } from '../lib/vault';
import Icon from './Icon';

interface TreeProps {
  current: string | null;
  openFile: (base: string) => void;
  dirty: Set<string>;
}

function TreeNode({ node, depth, current, openFile, dirty }: TreeProps & { node: VaultNode; depth: number }) {
  const [open, setOpen] = useState(true);
  const pad = { paddingLeft: 8 + depth * 13 };

  if (node.type === 'folder') {
    return (
      <div className="folder">
        <div className="node dir" style={pad} onClick={() => setOpen((o) => !o)}>
          <Icon name="chevron-right" size={14} className={`chev ${open ? 'open' : ''}`} />
          <Icon name={open ? 'folder-open' : 'folder'} size={15} style={{ color: 'var(--accent-3)', flex: '0 0 auto' }} />
          <span className="fname">{node.name}</span>
        </div>
        {open && (
          <div className="children">
            {node.children.map((c) => (
              <TreeNode key={c.path} node={c} depth={depth + 1} current={current} openFile={openFile} dirty={dirty} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const base = baseName(node.name);
  const sel = current === base;
  return (
    <div className={`node ${sel ? 'sel' : ''}`} style={pad} onClick={() => openFile(base)}>
      <Icon name="file-text" size={15} style={{ opacity: 0.75, flex: '0 0 auto' }} />
      <span className="fname">{base}</span>
      {dirty.has(base) && <span className="dot" title="Unsaved" />}
    </div>
  );
}

interface FileTreeProps extends TreeProps {
  nodes: VaultNode[];
  onNewFile: () => void;
  onNewFolder: () => void;
}

export default function FileTree({ nodes, current, openFile, dirty, onNewFile, onNewFolder }: FileTreeProps) {
  return (
    <>
      <div className="side-head">
        Files
        <div className="acts">
          <button title="New note" onClick={onNewFile}><Icon name="file-plus" size={15} /></button>
          <button title="New folder" onClick={onNewFolder}><Icon name="folder-plus" size={15} /></button>
          <button title="Collapse all"><Icon name="chevrons-down-up" size={15} /></button>
        </div>
      </div>
      <div className="tree">
        {nodes.map((n) => (
          <TreeNode key={n.path} node={n} depth={0} current={current} openFile={openFile} dirty={dirty} />
        ))}
      </div>
    </>
  );
}
