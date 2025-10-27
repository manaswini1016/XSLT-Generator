import { useState } from 'react';
import { Plus, Trash2, ArrowRight, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';

export function MappingInterface({ paths, outputFormat, onMappingsChange }) {
  const [mappings, setMappings] = useState([]);
  const [rootPath, setRootPath] = useState('');
  const [recordPath, setRecordPath] = useState('');

  const addMapping = () => {
    const newMapping = {
      id: Date.now(),
      sourcePath: '',
      sourceType: 'element',
      targetName: '',
      targetPath: '', // For hierarchical paths
      fieldType: 'string',
      occurs: 1,
      required: true,
      expanded: false // For UI collapse/expand
    };
    const updatedMappings = [...mappings, newMapping];
    setMappings(updatedMappings);
    updateParent(updatedMappings);
  };

  const removeMapping = (id) => {
    const updatedMappings = mappings.filter((m) => m.id !== id);
    setMappings(updatedMappings);
    updateParent(updatedMappings);
  };

  const updateMapping = (id, field, value) => {
    const updatedMappings = mappings.map((m) =>
      m.id === id ? { ...m, [field]: value } : m
    );
    setMappings(updatedMappings);
    updateParent(updatedMappings);
  };

  const updateMultipleFields = (id, updates) => {
    const updatedMappings = mappings.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    );
    setMappings(updatedMappings);
    updateParent(updatedMappings);
  };

  const updateParent = (currentMappings) => {
    onMappingsChange({
      rootPath,
      recordPath,
      fields: currentMappings,
    });
  };

  const handleRootPathChange = (value) => {
    setRootPath(value);
    onMappingsChange({
      rootPath: value,
      recordPath,
      fields: mappings,
    });
  };

  const handleRecordPathChange = (value) => {
    setRecordPath(value);
    onMappingsChange({
      rootPath,
      recordPath: value,
      fields: mappings,
    });
  };

  const getTargetLabel = () => {
    switch (outputFormat) {
      case 'json':
        return 'JSON Key';
      case 'flat':
        return 'Column Name';
      default:
        return 'Target Element';
    }
  };

  const toggleExpanded = (id) => {
    const updatedMappings = mappings.map((m) =>
      m.id === id ? { ...m, expanded: !m.expanded } : m
    );
    setMappings(updatedMappings);
  };

  const getHierarchyLevel = (targetPath) => {
    if (!targetPath) return 0;
    return targetPath.split('/').length - 1;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Field Mappings</CardTitle>
        <CardDescription>
          Map XML paths to output {outputFormat.toUpperCase()} structure
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Root and Record Path Configuration */}
        {outputFormat === 'flat' && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Root Path (optional)
              </label>
              <Input
                placeholder="e.g., /root or /*"
                value={rootPath}
                onChange={(e) => handleRootPathChange(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Record Path (for iteration)
              </label>
              <Input
                placeholder="e.g., /root/records/record or */record"
                value={recordPath}
                onChange={(e) => handleRecordPathChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                The element that represents each row in the flat file
              </p>
            </div>
          </div>
        )}

        {/* Hierarchy Info for XML output */}
        {outputFormat === 'xml' && mappings.length === 0 && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex gap-2">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">Hierarchical Output Support</p>
                <p className="text-blue-700 dark:text-blue-300">
                  Use slashes (/) in Target Path to create nested structures. Example: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">Order/Customer/Name</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mappings List */}
        <div className="space-y-3">
          {mappings.map((mapping, index) => {
            const hierarchyLevel = getHierarchyLevel(mapping.targetPath || mapping.targetName);
            
            return (
              <div
                key={mapping.id}
                className="border rounded-lg bg-card overflow-hidden"
                style={{ marginLeft: `${hierarchyLevel * 16}px` }}
              >
                {/* Main Row */}
                <div className="flex items-center gap-3 p-3">
                  <span className="text-sm font-medium text-muted-foreground w-6">
                    {index + 1}
                  </span>

                  {/* Expand/Collapse for XML format */}
                  {outputFormat === 'xml' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleExpanded(mapping.id)}
                      title={mapping.expanded ? 'Collapse' : 'Expand advanced options'}
                    >
                      {mapping.expanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  )}

                  {/* Source Path */}
                  <div className="flex-1 min-w-0">
                    <Select
                      value={mapping.sourcePath}
                      onChange={(e) =>
                        updateMapping(mapping.id, 'sourcePath', e.target.value)
                      }
                      className="w-full"
                    >
                      <option value="">Select source path...</option>
                      {paths &&
                        paths.map((path, idx) => (
                          <option key={idx} value={path.path}>
                            {path.path}
                            {path.type === 'attribute' ? ' (attr)' : ''}
                          </option>
                        ))}
                    </Select>
                  </div>

                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

                  {/* Target Name */}
                  <div className="flex-1 min-w-0">
                    <Input
                      placeholder={outputFormat === 'xml' ? 'Target Path (e.g., Parent/Child)' : getTargetLabel()}
                      value={mapping.targetName}
                      onChange={(e) => {
                        // Update both targetName and targetPath together
                        updateMultipleFields(mapping.id, {
                          targetName: e.target.value,
                          targetPath: e.target.value
                        });
                      }}
                    />
                  </div>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMapping(mapping.id)}
                    title="Remove mapping"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>

                {/* Expanded Options (XML only) */}
                {outputFormat === 'xml' && mapping.expanded && (
                  <div className="p-3 pt-0 border-t bg-muted/30">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Field Type */}
                      <div>
                        <label className="text-xs font-medium mb-1 block text-muted-foreground">
                          Field Type
                        </label>
                        <Select
                          value={mapping.fieldType || 'string'}
                          onChange={(e) =>
                            updateMapping(mapping.id, 'fieldType', e.target.value)
                          }
                          className="w-full text-sm"
                        >
                          <option value="string">String</option>
                          <option value="date">Date</option>
                          <option value="dateTime">Date Time</option>
                          <option value="time">Time</option>
                          <option value="currency">Currency</option>
                          <option value="numeric">Numeric</option>
                          <option value="decimal">Decimal</option>
                          <option value="component">Component</option>
                        </Select>
                      </div>

                      {/* Occurs */}
                      <div>
                        <label className="text-xs font-medium mb-1 block text-muted-foreground">
                          Occurs
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={mapping.occurs || 1}
                          onChange={(e) =>
                            updateMapping(mapping.id, 'occurs', parseInt(e.target.value) || 1)
                          }
                          className="text-sm"
                          placeholder="1"
                        />
                      </div>

                      {/* Required */}
                      <div>
                        <label className="text-xs font-medium mb-1 block text-muted-foreground">
                          Required
                        </label>
                        <Select
                          value={mapping.required === false ? 'false' : 'true'}
                          onChange={(e) =>
                            updateMapping(mapping.id, 'required', e.target.value === 'true')
                          }
                          className="w-full text-sm"
                        >
                          <option value="true">Yes</option>
                          <option value="false">No (Optional)</option>
                        </Select>
                      </div>

                      {/* Source Type */}
                      <div>
                        <label className="text-xs font-medium mb-1 block text-muted-foreground">
                          Source Type
                        </label>
                        <Select
                          value={mapping.sourceType || 'element'}
                          onChange={(e) =>
                            updateMapping(mapping.id, 'sourceType', e.target.value)
                          }
                          className="w-full text-sm"
                        >
                          <option value="element">Element</option>
                          <option value="attribute">Attribute</option>
                        </Select>
                      </div>
                    </div>

                    {/* Help text */}
                    <div className="mt-2 text-xs text-muted-foreground">
                      {mapping.fieldType === 'currency' && '💰 Will add currencyID="USD" attribute and format to 2 decimals'}
                      {mapping.fieldType === 'date' && '📅 Will use current-dateTime() as fallback if missing'}
                      {mapping.fieldType === 'component' && '📦 Container for nested fields - use with hierarchy'}
                      {mapping.occurs > 1 && `🔁 Will generate <xsl:for-each> for ${mapping.occurs} occurrences`}
                      {mapping.required === false && '⚠️ Optional field - will add fallback comment'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Mapping Button */}
        <Button onClick={addMapping} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Field Mapping
        </Button>

        {mappings.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No mappings yet. Click "Add Field Mapping" to start.
          </div>
        )}

        {/* Quick Add from Paths */}
        {paths && paths.length > 0 && mappings.length === 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Quick Actions:</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const newMappings = paths.slice(0, 5).map((path) => ({
                  id: Date.now() + Math.random(),
                  sourcePath: path.path,
                  sourceType: path.type,
                  targetName: path.name,
                  targetPath: path.name,
                  fieldType: 'string',
                  occurs: 1,
                  required: true,
                  expanded: false
                }));
                setMappings(newMappings);
                updateParent(newMappings);
              }}
            >
              Auto-map first 5 fields
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
