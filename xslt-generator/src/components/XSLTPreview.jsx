import { useState, useEffect } from 'react';
import { Download, Copy, CheckCircle2, Code } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Alert, AlertDescription, AlertTitle } from './ui/Alert';

export function XSLTPreview({ xsltContent, filename = 'transform.xslt' }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (!xsltContent) {
    return null;
  }

  const handleDownload = () => {
    const blob = new Blob([xsltContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(xsltContent);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const lineCount = xsltContent.split('\n').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Generated XSLT
            </CardTitle>
            <CardDescription>
              {lineCount} lines • Ready to download or copy
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={copied}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
            <Button size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Alert variant="success" className="mb-4">
          <AlertTitle>XSLT Generated Successfully</AlertTitle>
          <AlertDescription>
            Your XSLT transformation is ready. You can copy it or download it as a file.
          </AlertDescription>
        </Alert>

        <div className="relative">
          <pre className="p-4 bg-muted rounded-lg overflow-x-auto max-h-[500px] text-xs font-mono border">
            <code>{xsltContent}</code>
          </pre>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          <p className="font-medium mb-2">Usage Instructions:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Save the XSLT file with a .xslt or .xsl extension</li>
            <li>Use an XSLT processor (like Saxon, Xalan, or browser APIs) to apply the transformation</li>
            <li>Ensure your XML and XSLT are in the same encoding</li>
            <li>For JSON output, you'll need an XSLT 3.0 compatible processor</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
