# XSLT Generator

A modern, intuitive web application for generating XSLT transformations from XML files. Transform your XML data into XML, JSON, or flat file formats with an easy-to-use visual mapping interface.

![XSLT Generator](https://img.shields.io/badge/React-18.2.0-blue) ![Vite](https://img.shields.io/badge/Vite-4.4.9-purple) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3.3-teal)

## ✨ Features

- **📤 XML File Upload**: Drag-and-drop or browse to upload XML files
- **🔍 Automatic Path Extraction**: Automatically detects and displays all XML paths and attributes
- **🎯 Visual Mapping Interface**: Intuitive UI for mapping source XML to target output structure
- **📊 Multiple Output Formats**:
  - **XML**: Transform to different XML structures
  - **JSON**: Convert to JSON format (XSLT 3.0)
  - **Flat File**: Generate CSV/TSV output
- **👁️ Live Preview**: View generated XSLT in real-time
- **💾 Download & Copy**: Easy export of generated XSLT
- **🎨 Modern UI**: Beautiful, responsive design with dark mode support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (for development)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd xslt-generator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

## 📖 Usage

### Step 1: Upload XML File
- Click or drag-and-drop your XML file into the upload area
- The app will automatically parse and extract the XML structure

### Step 2: Select Output Format
- Choose your desired output format: XML, JSON, or Flat File
- View the parsed XML tree structure

### Step 3: Map Fields
- Add field mappings by clicking "Add Field Mapping"
- Select source XML paths from the dropdown
- Enter target field names for your output format
- Use "Auto-map first 5 fields" for quick setup

### Step 4: Generate & Download
- Click "Generate XSLT" to create your transformation
- Preview the generated XSLT code
- Copy to clipboard or download as a file

## 🛠️ Technology Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite 4
- **Styling**: TailwindCSS 3
- **Icons**: Lucide React
- **XML Parsing**: Native DOMParser API
- **Deployment**: Vercel

## 📁 Project Structure

```
xslt-generator/
├── public/
│   └── sample.xml          # Sample XML for testing
├── src/
│   ├── components/
│   │   ├── ui/             # Reusable UI components
│   │   ├── FileUpload.jsx  # XML file upload component
│   │   ├── XMLViewer.jsx   # XML tree viewer
│   │   ├── FormatSelector.jsx
│   │   ├── MappingInterface.jsx
│   │   └── XSLTPreview.jsx
│   ├── utils/
│   │   ├── xmlParser.js    # XML parsing utilities
│   │   ├── xsltGenerator.js # XSLT generation logic
│   │   └── cn.js           # Utility functions
│   ├── App.jsx             # Main application component
│   ├── main.jsx            # Application entry point
│   └── index.css           # Global styles
├── vercel.json             # Vercel deployment config
└── package.json

## 🌐 Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

## 🧪 Testing

Try the included sample XML file:
- Navigate to `public/sample.xml` for a bookstore example
- Upload it to test all features

## 🎯 Supported XSLT Features

### XML Output
- Element restructuring
- Attribute mapping
- Namespace handling
- Template-based transformation

### JSON Output
- XSLT 3.0 JSON output method
- Map-based structure
- Nested object support

### Flat File Output
- CSV/TSV generation
- Header row creation
- Configurable delimiters
- Flat data extraction

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the MIT License.

## 🐛 Known Issues & Limitations

- JSON output requires an XSLT 3.0 processor (Saxon HE/PE/EE)
- Complex XML namespaces may need manual adjustment
- Large XML files (>10MB) may impact performance

## 📚 Resources

- [XSLT 1.0 Specification](https://www.w3.org/TR/xslt-10/)
- [XSLT 3.0 Specification](https://www.w3.org/TR/xslt-30/)
- [Saxon XSLT Processor](https://www.saxonica.com/)

## 💡 Tips

- Start with simple mappings and test incrementally
- Use the XML viewer to understand your source structure
- For flat files, ensure you set the record path correctly
- Generated XSLT can be manually edited for advanced features

## 📧 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

Built with ❤️ using React + Vite
