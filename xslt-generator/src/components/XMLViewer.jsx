import { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, Hash } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';

export function XMLViewer({ xmlTree, paths }) {
  const [expandedNodes, setExpandedNodes] = useState(new Set(['root']));

  const toggleNode = (path) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const TreeNode = ({ node, path, level = 0 }) => {
    const nodePath = path || node.name;
    const isExpanded = expandedNodes.has(nodePath);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div className="select-none">
        <div
          className="flex items-start gap-2 py-1 px-2 hover:bg-accent rounded cursor-pointer group"
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
          onClick={() => hasChildren && toggleNode(nodePath)}
        >
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              )
            ) : (
              <div className="w-4" />
            )}
            
            <FileText className="w-4 h-4 flex-shrink-0 text-primary" />
            
            <span className="font-mono text-sm font-medium truncate">
              {node.name}
            </span>
            
            {node.textContent && (
              <span className="text-xs text-muted-foreground truncate ml-2">
                = "{node.textContent.substring(0, 30)}
                {node.textContent.length > 30 ? '...' : ''}"
              </span>
            )}
          </div>
          
          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {nodePath}
          </span>
        </div>

        {node.attributes && node.attributes.length > 0 && (
          <div style={{ paddingLeft: `${(level + 1) * 1.5 + 0.5}rem` }}>
            {node.attributes.map((attr, index) => (
              <div
                key={index}
                className="flex items-center gap-2 py-1 px-2 text-xs"
              >
                <Hash className="w-3 h-3 text-orange-500" />
                <span className="font-mono text-orange-600 dark:text-orange-400">
                  @{attr.name}
                </span>
                <span className="text-muted-foreground">
                  = "{attr.value.substring(0, 40)}
                  {attr.value.length > 40 ? '...' : ''}"
                </span>
              </div>
            ))}
          </div>
        )}

        {isExpanded &&
          hasChildren &&
          node.children.map((child, index) => (
            <TreeNode
              key={index}
              node={child}
              path={`${nodePath}/${child.name}`}
              level={level + 1}
            />
          ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>XML Structure</CardTitle>
        <CardDescription>
          {xmlTree 
            ? 'Expand nodes to view the structure. Click on paths to use in mappings.'
            : 'Upload an XML file to view its structure'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {xmlTree ? (
          <>
            <div className="border rounded-lg p-4 max-h-[500px] overflow-auto bg-muted/30">
              <TreeNode node={xmlTree} />
            </div>
            
            {paths && paths.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">
                  Detected Paths ({paths.length})
                </p>
                <div className="text-xs text-muted-foreground space-y-1 max-h-32 overflow-auto">
                  {paths.slice(0, 10).map((p, index) => (
                    <div key={index} className="font-mono">
                      {p.path}
                      {p.sampleValue && (
                        <span className="ml-2 text-primary">
                          = "{p.sampleValue}"
                        </span>
                      )}
                    </div>
                  ))}
                  {paths.length > 10 && (
                    <div className="text-muted-foreground italic">
                      ... and {paths.length - 10} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="border rounded-lg p-8 text-center bg-muted/30">
            <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No XML file loaded yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
