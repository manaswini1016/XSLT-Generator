import { FileJson, FileCode, FileText } from 'lucide-react';
import { Select } from './ui/Select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';

export function FormatSelector({ selectedFormat, onFormatChange }) {
  const formats = [
    {
      value: 'xml',
      label: 'XML',
      icon: FileCode,
      description: 'Transform to a different XML structure',
    },
    {
      value: 'json',
      label: 'JSON',
      icon: FileJson,
      description: 'Convert to JSON format (requires XSLT 3.0)',
    },
    {
      value: 'flat',
      label: 'Flat File (CSV)',
      icon: FileText,
      description: 'Generate delimited flat file output',
    },
  ];

  const currentFormat = formats.find((f) => f.value === selectedFormat);
  const Icon = currentFormat?.icon || FileCode;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Output Format</CardTitle>
        <CardDescription>
          Select the desired output format for your transformation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select
          value={selectedFormat}
          onChange={(e) => onFormatChange(e.target.value)}
          className="w-full"
        >
          {formats.map((format) => (
            <option key={format.value} value={format.value}>
              {format.label}
            </option>
          ))}
        </Select>

        {currentFormat && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg flex items-start gap-3">
            <Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">{currentFormat.label}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {currentFormat.description}
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-muted-foreground space-y-2">
          <p className="font-medium">Format Notes:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong>XML:</strong> Best for restructuring or filtering XML data
            </li>
            <li>
              <strong>JSON:</strong> Ideal for web APIs and modern applications
            </li>
            <li>
              <strong>Flat File:</strong> Perfect for database imports and spreadsheets
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
