/**
 * XML Parser Utility
 * Parses XML files and extracts structure information
 */

/**
 * Parse XML string and return DOM document
 */
export function parseXML(xmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  
  // Check for parsing errors
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('XML parsing error: ' + parserError.textContent);
  }
  
  return xmlDoc;
}

/**
 * Extract all unique paths from XML document
 */
export function extractPaths(xmlDoc) {
  const paths = new Set();
  const pathsWithInfo = [];
  
  function traverse(node, currentPath = '') {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const nodeName = node.nodeName;
      const newPath = currentPath ? `${currentPath}/${nodeName}` : nodeName;
      
      // Add element path
      const pathInfo = {
        path: newPath,
        type: 'element',
        name: nodeName,
        hasText: false,
        hasChildren: false,
        attributes: [],
        sampleValue: ''
      };
      
      // Check for attributes
      if (node.attributes.length > 0) {
        Array.from(node.attributes).forEach(attr => {
          pathInfo.attributes.push({
            name: attr.name,
            value: attr.value,
            path: `${newPath}/@${attr.name}`
          });
        });
      }
      
      // Check for text content
      const textContent = Array.from(node.childNodes)
        .filter(child => child.nodeType === Node.TEXT_NODE)
        .map(child => child.textContent.trim())
        .filter(text => text.length > 0)
        .join(' ');
      
      if (textContent) {
        pathInfo.hasText = true;
        pathInfo.sampleValue = textContent.substring(0, 50);
      }
      
      // Check for child elements
      const childElements = Array.from(node.children);
      pathInfo.hasChildren = childElements.length > 0;
      
      if (!paths.has(newPath)) {
        paths.add(newPath);
        pathsWithInfo.push(pathInfo);
      }
      
      // Add attribute paths
      pathInfo.attributes.forEach(attr => {
        if (!paths.has(attr.path)) {
          paths.add(attr.path);
          pathsWithInfo.push({
            path: attr.path,
            type: 'attribute',
            name: attr.name,
            parentPath: newPath,
            sampleValue: attr.value.substring(0, 50)
          });
        }
      });
      
      // Traverse children
      childElements.forEach(child => traverse(child, newPath));
    }
  }
  
  traverse(xmlDoc.documentElement);
  
  return pathsWithInfo;
}

/**
 * Convert XML document to a tree structure for display
 */
export function xmlToTree(xmlDoc) {
  function buildNode(element) {
    const node = {
      name: element.nodeName,
      type: 'element',
      attributes: [],
      children: [],
      textContent: ''
    };
    
    // Extract attributes
    if (element.attributes.length > 0) {
      node.attributes = Array.from(element.attributes).map(attr => ({
        name: attr.name,
        value: attr.value
      }));
    }
    
    // Extract text content (direct text nodes only)
    const textContent = Array.from(element.childNodes)
      .filter(child => child.nodeType === Node.TEXT_NODE)
      .map(child => child.textContent.trim())
      .filter(text => text.length > 0)
      .join(' ');
    
    if (textContent) {
      node.textContent = textContent;
    }
    
    // Process child elements
    Array.from(element.children).forEach(child => {
      node.children.push(buildNode(child));
    });
    
    return node;
  }
  
  return buildNode(xmlDoc.documentElement);
}

/**
 * Validate XML string
 */
export function validateXML(xmlString) {
  try {
    const xmlDoc = parseXML(xmlString);
    return { valid: true, error: null, document: xmlDoc };
  } catch (error) {
    return { valid: false, error: error.message, document: null };
  }
}

/**
 * Get namespace information from XML
 */
export function extractNamespaces(xmlDoc) {
  const namespaces = {};
  const root = xmlDoc.documentElement;
  
  // Get all attributes
  Array.from(root.attributes).forEach(attr => {
    if (attr.name.startsWith('xmlns:')) {
      const prefix = attr.name.substring(6);
      namespaces[prefix] = attr.value;
    } else if (attr.name === 'xmlns') {
      namespaces['default'] = attr.value;
    }
  });
  
  return namespaces;
}

/**
 * Get XPath expression for a path
 */
export function getXPathExpression(path) {
  // Simple path to XPath conversion
  // For more complex scenarios, this would need enhancement
  return '/' + path;
}
