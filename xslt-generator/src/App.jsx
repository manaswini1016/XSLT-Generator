import { useState } from 'react';
import { Zap, Github, AlertCircle } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { XMLViewer } from './components/XMLViewer';
import { FormatSelector } from './components/FormatSelector';
import { MappingInterface } from './components/MappingInterface';
import { XSLTPreview } from './components/XSLTPreview';
import { Button } from './components/ui/Button';
import { Alert, AlertDescription, AlertTitle } from './components/ui/Alert';
import { parseXML, extractPaths, xmlToTree, extractNamespaces } from './utils/xmlParser';
import { generateXSLT, validateXSLT } from './utils/xsltGenerator';

function App() {
  const [xmlContent, setXmlContent] = useState(null);
  const [xmlTree, setXmlTree] = useState(null);
  const [paths, setPaths] = useState([]);
  const [namespaces, setNamespaces] = useState({});
  const [outputFormat, setOutputFormat] = useState('xml');
  const [mappings, setMappings] = useState({ rootPath: '', recordPath: '', fields: [] });
  const [xsltContent, setXsltContent] = useState('');
  const [error, setError] = useState('');

  const handleFileLoad = (content, filename) => {
    setError('');
    setXsltContent('');
    
    if (!content) {
      // File cleared
      setXmlContent(null);
      setXmlTree(null);
      setPaths([]);
      setNamespaces({});
      setMappings({ rootPath: '', recordPath: '', fields: [] });
      return;
    }

    try {
      // Parse XML
      const xmlDoc = parseXML(content);
      
      // Extract structure
      const tree = xmlToTree(xmlDoc);
      const extractedPaths = extractPaths(xmlDoc);
      const ns = extractNamespaces(xmlDoc);
      
      setXmlContent(content);
      setXmlTree(tree);
      setPaths(extractedPaths);
      setNamespaces(ns);
      
    } catch (err) {
      setError('Failed to parse XML: ' + err.message);
    }
  };

  const handleGenerateXSLT = () => {
    setError('');
    
    console.log('Generate XSLT clicked');
    console.log('Mappings:', mappings);
    console.log('Output format:', outputFormat);
    
    // Validate mappings
    if (!mappings.fields || mappings.fields.length === 0) {
      setError('Please add at least one field mapping');
      return;
    }

    // Check if all mappings are complete
    const incompleteMappings = mappings.fields.filter(
      (m) => !m.sourcePath || !m.targetName
    );
    
    if (incompleteMappings.length > 0) {
      console.error('Incomplete mappings:', incompleteMappings);
      setError('Please complete all field mappings (source path and target name required)');
      return;
    }

    try {
      console.log('Starting XSLT generation...');
      
      // Generate XSLT
      const xslt = generateXSLT(outputFormat, mappings, {
        namespaces,
        delimiter: ',',
      });
      
      console.log('XSLT generated, length:', xslt.length);
      console.log('XSLT preview:', xslt.substring(0, 500));
      
      // Validate generated XSLT
      const validation = validateXSLT(xslt);
      console.log('XSLT validation result:', validation);
      
      if (!validation.valid) {
        setError('Generated XSLT is invalid: ' + validation.error);
        return;
      }
      
      setXsltContent(xslt);
      console.log('XSLT content set successfully');
      
    } catch (err) {
      console.error('Error generating XSLT:', err);
      setError('Failed to generate XSLT: ' + err.message + '\n\nStack: ' + err.stack);
    }
  };

  const canGenerate = xmlContent && mappings.fields && mappings.fields.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">XSLT Generator</h1>
                <p className="text-sm text-muted-foreground">
                  Transform XML to any format
                </p>
              </div>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Error Display - Show at top if present */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Upload XML */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </div>
              <h2 className="text-xl font-semibold">Upload XML File</h2>
            </div>
            <FileUpload onFileLoad={handleFileLoad} />
          </section>

          {/* Step 2: Select Format & View XML */}
          <section className={!xmlContent ? 'opacity-50 pointer-events-none' : ''}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                xmlContent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
              <h2 className="text-xl font-semibold">Configure Output</h2>
              {!xmlContent && (
                <span className="text-sm text-muted-foreground">(Upload XML first)</span>
              )}
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <FormatSelector
                selectedFormat={outputFormat}
                onFormatChange={setOutputFormat}
              />
              <XMLViewer xmlTree={xmlTree} paths={paths} />
            </div>
          </section>

          {/* Step 3: Map Fields */}
          <section className={!xmlContent ? 'opacity-50 pointer-events-none' : ''}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                xmlContent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                3
              </div>
              <h2 className="text-xl font-semibold">Map Fields</h2>
              {!xmlContent && (
                <span className="text-sm text-muted-foreground">(Upload XML first)</span>
              )}
            </div>
            <MappingInterface
              paths={paths}
              outputFormat={outputFormat}
              onMappingsChange={setMappings}
            />
          </section>

          {/* Generate Button */}
          <section className="flex flex-col items-center gap-4">
            <Button
              size="lg"
              onClick={handleGenerateXSLT}
              disabled={!canGenerate}
              className="px-8"
            >
              <Zap className="w-5 h-5 mr-2" />
              Generate XSLT
            </Button>
            {!canGenerate && xmlContent && (
              <p className="text-sm text-muted-foreground">
                Add at least one field mapping to generate XSLT
              </p>
            )}
            {!xmlContent && (
              <p className="text-sm text-muted-foreground">
                Upload an XML file and add mappings to generate XSLT
              </p>
            )}
          </section>

          {/* Step 4: Preview & Download */}
          {xsltContent && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  4
                </div>
                <h2 className="text-xl font-semibold">Download XSLT</h2>
              </div>
              <XSLTPreview
                xsltContent={xsltContent}
                filename={`transform-${outputFormat}.xslt`}
              />
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 text-center text-sm text-muted-foreground">
        <p>
          Built with React + Vite • Deploy on{' '}
          <a
            href="https://vercel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Vercel
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
