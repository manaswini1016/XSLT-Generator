# XSLT Generator Web App - Project Plan

## ✅ PROJECT COMPLETED

**Status**: Production-ready application with all features implemented and tested.

**Major Achievement**: Fixed critical XSLT generation bug - implemented hierarchical template generation algorithm that produces valid, working XSLT.

---

## Project Overview
A React-based web application that generates XSLT transformations from XML files, supporting multiple output formats (XML, JSON, Flat File).

## Architecture

### Frontend Stack
- **Framework**: React 18 with Vite
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **XML Parsing**: DOMParser (native) + custom utilities
- **State Management**: React hooks (useState, useContext)

### Key Features
1. **XML File Upload**: Drag-and-drop or file selector
2. **XML Path Extraction**: Automatic parsing and XPath generation
3. **Output Format Selection**: Dropdown for XML/JSON/Flat File
4. **Mapping Interface**: Visual mapping between input and output structures
5. **XSLT Generation**: Dynamic XSLT 1.0/2.0 generation based on mappings
6. **Preview & Download**: View generated XSLT and download

### Component Structure
```
src/
├── App.jsx                      # Main app component
├── components/
│   ├── FileUpload.jsx          # XML file upload component
│   ├── XMLViewer.jsx           # Display parsed XML structure
│   ├── FormatSelector.jsx      # Output format dropdown
│   ├── MappingInterface.jsx    # Drag-and-drop mapping UI
│   ├── XSLTPreview.jsx         # Display generated XSLT
│   └── ui/                     # shadcn/ui components
├── utils/
│   ├── xmlParser.js            # Parse XML and extract paths
│   ├── xsltGenerator.js        # Generate XSLT for each format
│   └── pathExtractor.js        # Extract XPath expressions
└── styles/
    └── globals.css             # Global styles with Tailwind

### XSLT Generation Logic

#### For XML Output
- Transform XML structure to new XML schema
- Support element renaming, restructuring, filtering
- Generate namespace-aware XSLT

#### For JSON Output
- Generate XSLT 3.0 with JSON output method
- Map XML elements to JSON objects/arrays
- Handle nested structures

#### For Flat File Output
- Generate delimited text output (CSV/TSV)
- Flatten nested XML structures
- Support custom delimiters

### Deployment
- **Platform**: Vercel
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18+

## Development Phases

### Phase 1: Project Setup ✓
- Initialize Vite + React project
- Install dependencies
- Configure TailwindCSS and shadcn/ui
- Set up project structure

### Phase 2: Core Functionality
- XML file upload and validation
- XML parsing and XPath extraction
- Display XML tree structure

### Phase 3: Mapping Interface
- Build drag-and-drop or selection-based mapping UI
- Allow users to map input paths to output structure
- Support attribute mapping

### Phase 4: XSLT Generation
- Implement XSLT generators for each format
- Validate generated XSLT
- Add error handling

### Phase 5: UI Polish & Testing
- Responsive design
- Error messages and validation
- Example XML files
- User guide/tooltips

### Phase 6: Deployment
- Configure vercel.json
- Add build scripts
- Deploy to Vercel

## Technical Considerations

### XML Parsing
- Handle namespaces correctly
- Support complex nested structures
- Extract all unique XPaths
- Identify attributes vs elements

### XSLT Generation Challenges
- Different XSLT versions (1.0 vs 2.0/3.0)
- JSON output requires XSLT 3.0
- Flat file output needs custom text processing
- Handle edge cases (empty nodes, mixed content)

### User Experience
- Clear visual feedback
- Intuitive mapping interface
- Real-time preview
- Download options

## Success Criteria
- ✓ Upload XML file successfully
- ✓ Extract and display all XML paths/attributes
- ✓ Map input to output structure
- ✓ Generate valid XSLT for all three formats
- ✓ Preview generated XSLT
- ✓ Download XSLT file
- ✓ Responsive, modern UI
- ✓ Deployed on Vercel
- ✓ Bug-free, robust error handling
