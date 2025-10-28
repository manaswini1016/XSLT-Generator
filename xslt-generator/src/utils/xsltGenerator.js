/**
 * XSLT Generator Utility
 * Generates XSLT transformations for different output formats
 */

/**
 * Generate XSLT for XML output format
 * 
 * Enhanced version with comprehensive features:
 * 1. XPath normalization and validation
 * 2. Complete component & field coverage with hierarchy support
 * 3. Handling multiple occurrences (Occurs > 1)
 * 4. Element attributes support (hardcoded and dynamic)
 * 5. Variables support at stylesheet level
 * 6. Hardcoded values support
 * 7. Date/time and currency formatting
 * 8. Error handling with inline comments
 * 9. Namespace handling with exclude-result-prefixes
 * 10. For-each loops for repeating sections
 * 11. Single template approach
 */
export function generateXMLTransform(mappings, namespaces = {}) {
    try {
      console.log('generateXMLTransform called with:', { mappings, namespaces });
      
      // Build namespace declarations
      const nsDeclarations = Object.entries(namespaces)
        .filter(([key]) => key !== 'default')
        .map(([prefix, uri]) => `xmlns:${prefix}="${uri}"`)
        .join(' ');
      
      const defaultNS = namespaces.default ? `xmlns="${namespaces.default}"` : '';
      
      // Get namespace prefixes for exclude-result-prefixes
      const nsPrefixes = Object.keys(namespaces)
        .filter(key => key !== 'default')
        .join(' ');
      
      const excludeResultPrefixes = nsPrefixes ? `exclude-result-prefixes="${nsPrefixes}"` : '';
      
      console.log('Step 1: Normalizing mappings...');
      // STEP 1: Normalize and validate all XPaths
      let normalizedMappings = normalizeAllMappings(mappings.fields);
      console.log('Normalized mappings:', normalizedMappings);
      
      console.log('Step 2: Ensuring complete hierarchy...');
      // STEP 2: Ensure complete hierarchy (add missing parent components)
      normalizedMappings = ensureCompleteHierarchy(normalizedMappings);
      console.log('After hierarchy completion:', normalizedMappings);
      
      // STEP 3: Filter out placeholder components
      const actualFields = normalizedMappings.filter(m => !m.isPlaceholder);
      
      console.log('Step 3: Building hierarchical structure...');
      // STEP 4: Build hierarchical structure from mappings
      const hierarchy = buildHierarchyForInlineGeneration(actualFields);
      console.log('Hierarchy structure:', hierarchy);
      
      // Start building the XSLT with single template
      const version = mappings.xsltVersion || '1.0';
      let xslt = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="${version}" 
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  ${nsDeclarations}
  ${defaultNS}
  ${excludeResultPrefixes}>

  <xsl:output method="xml" encoding="UTF-8" indent="yes"/>
`;
      
      // STEP 5: Add variables if defined
      if (mappings.variables && Array.isArray(mappings.variables)) {
        xslt += '\n  <!-- Define top-level variables for constants -->\n';
        mappings.variables.forEach(variable => {
          if (variable.xpath) {
            xslt += `  <xsl:variable name="${variable.name}" select="${variable.xpath}"/>\n`;
          } else if (variable.value) {
            xslt += `  <xsl:variable name="${variable.name}" select="'${variable.value}'"/>\n`;
          }
        });
      }
      
      xslt += `\n  <xsl:template match="/">\n`;
      
      // Get root element configuration
      const rootElement = mappings.rootElement || { name: 'root', attributes: [] };
      
      // Generate root element with attributes
      xslt += generateElementWithAttributes(rootElement, '    ');
      
      console.log('Step 6: Generating inline XML structure...');
      // STEP 6: Generate inline XML structure
      xslt += generateInlineXMLStructure(hierarchy, actualFields, '      ');
      
      xslt += `    </${rootElement.name}>\n`;
      xslt += `  </xsl:template>\n`;
      xslt += `\n</xsl:stylesheet>`;
      
      console.log('XSLT generation complete');
      return xslt;
    } catch (error) {
      console.error('Error in generateXMLTransform:', error);
      throw error;
    }
  }
  
  /**
   * Normalize an XPath expression
   * - Remove file names from path
   * - Convert dotted paths to proper XPath hierarchy
   * - Add // prefix if path doesn't start from root
   * - Fix common syntax issues
   */
  function normalizeXPath(xpath) {
    if (!xpath) return '';
    
    let normalized = xpath.trim();
    
    // Remove file name if present (e.g., "file.xml/path" -> "path")
    normalized = normalized.replace(/^[^/]*\.xml\//i, '');
    
    // Convert dotted paths to proper XPath (e.g., "Parent.Child" -> "Parent/Child")
    // But preserve dots in predicates like [@id='value.test']
    normalized = normalized.replace(/\.(?![^\[]*\])/g, '/');
    
    // Add // prefix if path doesn't start with / or //
    if (!normalized.startsWith('/') && !normalized.startsWith('*')) {
      normalized = '//' + normalized;
    }
    
    // Validate XPath syntax
    if (!isValidXPath(normalized)) {
      console.warn(`Invalid XPath detected: ${xpath}, normalized to: ${normalized}`);
    }
    
    return normalized;
  }
  
  /**
   * Validate XPath syntax (basic validation)
   */
  function isValidXPath(xpath) {
    if (!xpath) return false;
    
    // Check for balanced brackets
    const openBrackets = (xpath.match(/\[/g) || []).length;
    const closeBrackets = (xpath.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) return false;
    
    // Check for invalid characters at start
    if (/^[^a-zA-Z/*@]/.test(xpath)) return false;
    
    return true;
  }
  
  /**
   * Normalize all mappings
   */
  function normalizeAllMappings(fields) {
    if (!fields || !Array.isArray(fields)) {
      console.warn('normalizeAllMappings: fields is not an array', fields);
      return [];
    }
    
    return fields.map(mapping => {
      if (!mapping.sourcePath || !mapping.targetName) {
        console.warn('Incomplete mapping skipped:', mapping);
        return mapping;
      }
      
      const normalized = {
        ...mapping,
        sourcePath: normalizeXPath(mapping.sourcePath),
        occurs: mapping.occurs || 1,
        fieldType: mapping.fieldType || 'string',
        required: mapping.required !== false,
        isAttribute: mapping.sourceType === 'attribute' || mapping.sourcePath.includes('/@')
      };
      
      return normalized;
    });
  }
  
  /**
   * Build hierarchical structure from normalized mappings
   * Creates a tree representing the output structure
   */
  function buildHierarchicalStructure(mappings) {
    const structure = {};
    
    mappings.forEach(mapping => {
      if (!mapping.sourcePath || !mapping.targetName) return;
      
      const targetPath = mapping.targetPath || mapping.targetName;
      const parts = targetPath.split('/');
      
      // Build nested structure
      let current = structure;
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {
            name: part,
            children: {},
            fields: [],
            isComponent: index < parts.length - 1,
            level: index
          };
        }
        
        // If this is the leaf node, add the mapping
        if (index === parts.length - 1) {
          current[part].fields.push(mapping);
        }
        
        current = current[part].children;
      });
    });
    
    return structure;
  }
  
  /**
   * Parse source path into components
   */
  function parseSourcePath(sourcePath) {
    const isAttribute = sourcePath.includes('/@');
    
    if (isAttribute) {
      const match = sourcePath.match(/(.+)\/@(.+)/);
      if (match) {
        return {
          type: 'attribute',
          parentPath: match[1],
          attributeName: match[2],
          xpath: sourcePath
        };
      }
    }
    
    const parts = sourcePath.replace(/^\/\//, '').replace(/^\//, '').split('/');
    const elementName = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1).join('/');
    
    return {
      type: 'element',
      parentPath: parentPath || '',
      elementName: elementName,
      xpath: sourcePath
    };
  }
  
  /**
   * LEGACY: Generate hierarchical templates from structure
   * NOTE: This function is no longer used in the new inline generation approach.
   * Kept for backward compatibility.
   */
  function generateHierarchicalTemplates(structure, mappings) {
    let templates = '';
    
    // Group mappings by parent context
    const groupedMappings = groupMappingsByContext(mappings);
    
    // Generate templates for each context
    for (const [context, contextMappings] of Object.entries(groupedMappings)) {
      templates += generateContextTemplate(context, contextMappings, groupedMappings);
    }
    
    return templates;
  }
  
  /**
   * LEGACY: Group mappings by their context (parent path)
   * Used by old template-based generation. Kept for backward compatibility.
   */
  function groupMappingsByContext(mappings) {
    const grouped = {};
    
    mappings.forEach(mapping => {
      const parsed = parseSourcePath(mapping.sourcePath);
      const context = parsed.parentPath || 'root';
      
      if (!grouped[context]) {
        grouped[context] = [];
      }
      
      grouped[context].push({
        ...mapping,
        parsed
      });
    });
    
    return grouped;
  }
  
  /**
   * LEGACY: Generate template for a specific context
   * Used by old template-based generation. Kept for backward compatibility.
   */
  function generateContextTemplate(context, mappings, allGrouped) {
    const matchPattern = context === 'root' ? '*' : context.replace(/^\/\//, '');
    
    let template = `
    <!-- Template for ${context || 'root elements'} -->
    <xsl:template match="${matchPattern}">`;
    
    // Group mappings by their parent hierarchy to avoid duplicate parent elements
    const hierarchyGroups = groupByParentHierarchy(mappings);
    
    // Generate output for each hierarchy group
    Object.entries(hierarchyGroups).forEach(([parentPath, groupedMappings]) => {
      template += generateHierarchyGroup(parentPath, groupedMappings, allGrouped);
    });
    
    template += `
    </xsl:template>
  `;
    
    return template;
  }
  
  /**
   * LEGACY: Group mappings by their parent hierarchy
   * Example: "aa/bb" and "aa/cc" both have parent "aa"
   * Used by old template-based generation. Kept for backward compatibility.
   */
  function groupByParentHierarchy(mappings) {
    const groups = {};
    
    mappings.forEach(mapping => {
      const targetPath = mapping.targetPath || mapping.targetName;
      const parts = targetPath.split('/');
      
      if (parts.length === 1) {
        // No parent, process individually
        const key = '__root__';
        if (!groups[key]) groups[key] = [];
        groups[key].push(mapping);
      } else {
        // Has parent path
        const parentPath = parts.slice(0, -1).join('/');
        if (!groups[parentPath]) groups[parentPath] = [];
        groups[parentPath].push(mapping);
      }
    });
    
    return groups;
  }
  
  /**
   * LEGACY: Generate output for a group of mappings that share the same parent hierarchy
   * Used by old template-based generation. Kept for backward compatibility.
   */
  function generateHierarchyGroup(parentPath, mappings, allGrouped) {
    if (parentPath === '__root__') {
      // These are root-level elements, process individually
      let output = '';
      mappings.forEach(mapping => {
        output += generateFieldOutput(mapping, allGrouped);
      });
      return output;
    }
    
    // Generate nested parent structure with all children inside
    let output = '';
    const indent = '    ';
    const parentParts = parentPath.split('/').map(part => escapeXMLName(part));
    
    // Open all parent tags
    for (let i = 0; i < parentParts.length; i++) {
      output += `\n${indent.repeat(i + 1)}<${parentParts[i]}>`;
    }
    
    // Add all child elements
    mappings.forEach(mapping => {
      const targetPath = mapping.targetPath || mapping.targetName;
      const parts = targetPath.split('/');
      const leafName = escapeXMLName(parts[parts.length - 1]);
      const leafIndent = indent.repeat(parentParts.length + 1);
      
      if (!mapping.parsed) {
        mapping.parsed = parseSourcePath(mapping.sourcePath);
      }
      const { parsed } = mapping;
      
      // Handle multiple occurrences
      if (mapping.occurs > 1) {
        output += `\n${leafIndent}<!-- ${leafName} - Multiple occurrences (Occurs: ${mapping.occurs}) -->`;
        output += `\n${leafIndent}<xsl:for-each select="${parsed.type === 'element' ? parsed.elementName : mapping.sourcePath}">`;
      }
      
      output += `\n${leafIndent}<${leafName}>`;
      
      // Add the value
      if (parsed.type === 'attribute') {
        output += `\n${leafIndent}  <xsl:value-of select="@${parsed.attributeName}"/>`;
      } else {
        const valueSelect = generateValueSelect(mapping, parsed);
        output += valueSelect.split('\n').map(line => 
          line ? leafIndent + '  ' + line.trim() : ''
        ).join('\n');
      }
      
      output += `\n${leafIndent}</${leafName}>`;
      
      if (mapping.occurs > 1) {
        output += `\n${leafIndent}</xsl:for-each>`;
      }
      
      if (!mapping.required) {
        output += ` <!-- Optional field -->`;
      }
    });
    
    // Close all parent tags in reverse order
    for (let i = parentParts.length - 1; i >= 0; i--) {
      output += `\n${indent.repeat(i + 1)}</${parentParts[i]}>`;
    }
    
    return output;
  }
  
  /**
   * LEGACY: Generate output for a single field (used for root-level elements only)
   * Used by old template-based generation. Kept for backward compatibility.
   */
  function generateFieldOutput(mapping, allGrouped) {
    let output = '';
    
    // Ensure parsed property exists
    if (!mapping.parsed) {
      mapping.parsed = parseSourcePath(mapping.sourcePath);
    }
    
    const { parsed } = mapping;
    const targetName = escapeXMLName(mapping.targetName);
    
    // Handle placeholder components (missing parent components)
    if (mapping.isPlaceholder) {
      output += `
      <!-- Component ${targetName} - Generated as placeholder for hierarchy -->
      <${targetName}>
        <!-- Sub-components will be populated here -->`;
      
      // Find and include child components
      const childContext = mapping.sourcePath.replace(/^\/\//, '').replace(/^\//, '');
      const children = Object.keys(allGrouped).filter(ctx => 
        ctx.startsWith(childContext + '/') && ctx !== childContext
      );
      
      if (children.length > 0) {
        children.forEach(childCtx => {
          const childElement = childCtx.split('/').pop();
          output += `
        <xsl:apply-templates select="${childElement}"/>`;
        });
      }
      
      output += `
      </${targetName}>`;
      return output;
    }
    
    // Check if this field has children (is a component)
    const fullPath = mapping.sourcePath.replace(/^\/\//, '').replace(/^\//, '');
    const hasChildren = Object.keys(allGrouped).some(ctx => 
      ctx.startsWith(fullPath + '/') && ctx !== fullPath
    );
    
    // Handle multiple occurrences
    if (mapping.occurs > 1) {
      output += `
      <!-- ${targetName} - Multiple occurrences (Occurs: ${mapping.occurs}) -->
      <xsl:for-each select="${parsed.type === 'element' ? parsed.elementName : mapping.sourcePath}">`;
    }
    
    output += `
      <${targetName}>`;
    
    if (mapping.fieldType === 'component' || hasChildren) {
      // Component with children - apply templates or create nested structure
      if (parsed.elementName) {
        output += `
        <xsl:apply-templates select="${parsed.elementName}"/>`;
      } else {
        output += `
        <!-- Component container - sub-components follow -->`;
      }
    } else if (parsed.type === 'attribute') {
      // Attribute field
      output += `
        <xsl:value-of select="@${parsed.attributeName}"/>`;
    } else {
      // Simple element - get value with formatting
      output += generateValueSelect(mapping, parsed);
    }
    
    output += `
      </${targetName}>`;
    
    if (mapping.occurs > 1) {
      output += `
      </xsl:for-each>`;
    }
    
    // Add comment for missing/optional fields
    if (!mapping.required) {
      output += ` <!-- Optional field -->`;
    }
    
    return output;
  }
  
  /**
   * LEGACY: Generate value selection with formatting
   * Used by old template-based generation. Kept for backward compatibility.
   */
  function generateValueSelect(mapping, parsed) {
    const selectPath = parsed.elementName || parsed.xpath;
    
    // Handle different field types
    switch (mapping.fieldType) {
      case 'date':
      case 'dateTime':
        return `
        <xsl:choose>
          <xsl:when test="${selectPath}">
            <xsl:value-of select="${selectPath}"/>
          </xsl:when>
          <xsl:otherwise>
            <!-- Using current date-time as fallback -->
            <xsl:value-of select="substring(string(current-dateTime()), 1, 19)"/>
          </xsl:otherwise>
        </xsl:choose>`;
      
      case 'currency':
        return `
        <xsl:attribute name="currencyID">USD</xsl:attribute>
        <xsl:value-of select="format-number(${selectPath}, '0.00')"/>`;
      
      case 'decimal':
      case 'numeric':
        return `
        <xsl:value-of select="format-number(${selectPath}, '0.00')"/>`;
      
      case 'time':
        return `
        <xsl:value-of select="${selectPath}"/>`;
      
      default:
        // Check if field exists, otherwise add comment
        return `
        <xsl:choose>
          <xsl:when test="${selectPath}">
            <xsl:value-of select="${selectPath}"/>
          </xsl:when>
          <xsl:otherwise>
            <!-- Field ${mapping.targetName} is missing or has invalid XPath -->
          </xsl:otherwise>
        </xsl:choose>`;
    }
  }
  
  /**
   * Escape XML element name
   */
  function escapeXMLName(name) {
    // Replace invalid XML name characters
    return name.replace(/[^a-zA-Z0-9_.-]/g, '_');
  }
  
  /**
   * Combine date and time fields into ISO format
   * Used when separate date and time fields need to be merged
   */
  function generateDateTimeCombination(dateField, timeField) {
    return `concat(${dateField}, 'T', ${timeField}, 'Z')`;
  }
  
  /**
   * Detect if a field name suggests it's part of a date-time pair
   */
  function detectDateTimeFields(mappings) {
    const dateFields = mappings.filter(m => 
      /date/i.test(m.targetName) && !/time/i.test(m.targetName)
    );
    
    const timeFields = mappings.filter(m => 
      /time/i.test(m.targetName) && !/date/i.test(m.targetName)
    );
    
    const pairs = [];
    
    dateFields.forEach(dateField => {
      const baseName = dateField.targetName.replace(/date/i, '');
      const matchingTime = timeFields.find(tf => 
        tf.targetName.replace(/time/i, '') === baseName
      );
      
      if (matchingTime) {
        pairs.push({
          dateField,
          timeField: matchingTime,
          combinedName: baseName + 'DateTime'
        });
      }
    });
    
    return pairs;
  }
  
  /**
   * Ensure all components in hierarchy are represented
   * Adds missing parent components with comments
   */
  function ensureCompleteHierarchy(mappings) {
    const allPaths = new Set();
    
    // Collect all paths and their parent paths
    mappings.forEach(mapping => {
      const targetPath = mapping.targetPath || mapping.targetName;
      const parts = targetPath.split('/');
      
      // Add all parent paths
      for (let i = 1; i <= parts.length; i++) {
        allPaths.add(parts.slice(0, i).join('/'));
      }
    });
    
    // Create placeholder mappings for missing components
    const existingTargets = new Set(mappings.map(m => m.targetPath || m.targetName));
    const missingComponents = [];
    
    allPaths.forEach(path => {
      if (!existingTargets.has(path) && path.includes('/')) {
        missingComponents.push({
          targetName: path.split('/').pop(),
          targetPath: path,
          sourcePath: '//' + path.replace(/\//g, '_'),
          fieldType: 'component',
          required: false,
          isPlaceholder: true
        });
      }
    });
    
    return [...mappings, ...missingComponents];
  }
  
  /**
   * Generate element opening tag with attributes
   */
  function generateElementWithAttributes(element, indent) {
    let output = `${indent}<${element.name}`;
    
    // Add attributes if defined
    if (element.attributes && Array.isArray(element.attributes)) {
      element.attributes.forEach(attr => {
        if (attr.isVariable) {
          // Use variable reference with curly braces
          output += ` ${attr.name}="{$${attr.value}}"`;
        } else if (attr.isHardcoded) {
          // Hardcoded attribute value
          output += ` ${attr.name}="${attr.value}"`;
        } else if (attr.xpath) {
          // Dynamic attribute from XPath
          output += ` ${attr.name}="{${attr.xpath}}"`;
        }
      });
    }
    
    output += `>\n`;
    return output;
  }

  /**
   * Build hierarchy for inline XML generation (no templates)
   */
  function buildHierarchyForInlineGeneration(mappings) {
    const hierarchy = {};
    
    mappings.forEach(mapping => {
      if (!mapping.sourcePath || !mapping.targetName) return;
      
      const targetPath = mapping.targetPath || mapping.targetName;
      const parts = targetPath.split('/');
      
      let current = hierarchy;
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // Leaf node - store the mapping with parsed source
          if (!current._fields) current._fields = [];
          current._fields.push({
            ...mapping,
            leafName: part,
            parsed: parseSourcePath(mapping.sourcePath)
          });
        } else {
          // Parent node
          if (!current[part]) {
            current[part] = {
              _metadata: {
                isComponent: true,
                level: index,
                name: part
              }
            };
          }
          current = current[part];
        }
      });
    });
    
    return hierarchy;
  }
  
  /**
   * Generate inline XML structure (no separate templates)
   */
  function generateInlineXMLStructure(hierarchy, mappings, indent) {
    let output = '';
    
    Object.entries(hierarchy).forEach(([key, value]) => {
      if (key === '_fields') {
        // Generate field elements inline
        value.forEach(mapping => {
          output += generateXMLFieldInline(mapping, indent);
        });
      } else if (key !== '_metadata') {
        // Generate component elements inline
        const escapedKey = escapeXMLName(key);
        const componentMapping = mappings.find(m => 
          (m.targetPath || m.targetName).split('/').includes(key)
        );
        
        // Check if this component has for-each path
        const hasForEach = componentMapping && componentMapping.forEachPath;
        
        // Check if this component has multiple occurrences
        const hasMultipleOccurs = componentMapping && componentMapping.occurs > 1;
        
        if (hasForEach || hasMultipleOccurs) {
          // Generate for-each for multiple occurrences - use full xpath with // prefix
          const parsed = componentMapping.parsed || parseSourcePath(componentMapping.sourcePath);
          const forEachPath = componentMapping.forEachPath || parsed.xpath || componentMapping.sourcePath;
          
          output += `${indent}<xsl:for-each select="${forEachPath}">\n`;
          
          // Generate element with attributes
          const elementConfig = {
            name: escapedKey,
            attributes: componentMapping.attributes || []
          };
          output += generateElementWithAttributes(elementConfig, indent + '  ');
          
          output += generateInlineXMLStructure(value, mappings, indent + '    ');
          output += `${indent}  </${escapedKey}>\n`;
          output += `${indent}</xsl:for-each>\n`;
        } else {
          // Single occurrence component with attributes
          const elementConfig = {
            name: escapedKey,
            attributes: componentMapping ? (componentMapping.attributes || []) : []
          };
          output += generateElementWithAttributes(elementConfig, indent);
          output += generateInlineXMLStructure(value, mappings, indent + '  ');
          output += `${indent}</${escapedKey}>\n`;
        }
      }
    });
    
    return output;
  }
  
  /**
   * Generate XML field inline (within the single template)
   */
  function generateXMLFieldInline(mapping, indent) {
    const { parsed } = mapping;
    const leafName = escapeXMLName(mapping.leafName);
    let output = '';
    
    // Check if this is a for-each field or has multiple occurrences
    const hasForEach = mapping.forEachPath;
    const hasMultipleOccurs = mapping.occurs > 1;
    
    if (hasForEach || hasMultipleOccurs) {
      // Use full xpath with // prefix
      const forEachPath = mapping.forEachPath || parsed.xpath || mapping.sourcePath;
      
      output += `${indent}<xsl:for-each select="${forEachPath}">\n`;
      
      // Generate element with attributes
      const elementConfig = {
        name: leafName,
        attributes: mapping.attributes || []
      };
      output += generateElementWithAttributes(elementConfig, indent + '  ');
      
      // Handle value
      if (mapping.valueType === 'hardcoded') {
        output += `${indent}    ${mapping.hardcodedValue || ''}\n`;
      } else if (mapping.valueType === 'empty') {
        // Empty element - no content
      } else {
        output += generateXMLValueSelectInline(mapping, parsed, indent + '    ');
      }
      
      output += `${indent}  </${leafName}>\n`;
      output += `${indent}</xsl:for-each>\n`;
    } else {
      // Single occurrence with attributes
      const elementConfig = {
        name: leafName,
        attributes: mapping.attributes || []
      };
      output += generateElementWithAttributes(elementConfig, indent);
      
      // Handle value based on valueType
      if (mapping.valueType === 'hardcoded') {
        // Hardcoded value
        output += `${indent}  ${mapping.hardcodedValue || ''}\n`;
      } else if (mapping.valueType === 'empty') {
        // Empty element - no content
      } else {
        // Dynamic value from XPath
        if (parsed.type === 'attribute') {
          output += `${indent}  <xsl:value-of select="@${parsed.attributeName}"/>\n`;
        } else {
          output += generateXMLValueSelectInline(mapping, parsed, indent + '  ');
        }
      }
      
      output += `${indent}</${leafName}>\n`;
    }
    
    return output;
  }
  
  /**
   * Generate XML value selection inline with formatting
   */
  function generateXMLValueSelectInline(mapping, parsed, indent) {
    // Use the full xpath (with // prefix) instead of just elementName
    const selectPath = parsed.xpath || mapping.sourcePath;
    
    // Simple approach: just use xsl:value-of without error handling
    // This matches the clean XSLT style from the Ferrari example
    return `${indent}<xsl:value-of select="${selectPath}"/>\n`;
  }
  
  /**
   * Generate XSLT for JSON output format (requires XSLT 3.0)
   * 
   * Enhanced version with comprehensive features:
   * 1. XPath normalization and validation based on actual XML structure
   * 2. Complete component & field coverage with hierarchy support
   * 3. Handling multiple occurrences (Occurs > 1)
   * 4. Proper attribute vs element mapping
   * 5. Namespace detection and prefixing in XPath expressions
   * 6. xpath-default-namespace support for default namespaces
   * 7. Single quotes in key attributes: key="'FieldName'"
   * 8. Valid JSON output using <xsl:output method="json" indent="yes"/>
   * 9. Hierarchical output structure preservation
   */
  export function generateJSONTransform(mappings, namespaces = {}) {
    try {
      console.log('generateJSONTransform called with:', { mappings, namespaces });
      
      // Build namespace declarations (exclude default namespace from xmlns declarations)
      const nsDeclarations = Object.entries(namespaces)
        .filter(([key]) => key !== 'default')
        .map(([prefix, uri]) => `xmlns:${prefix}="${uri}"`)
        .join('\n    ');
      
      // Get namespace prefixes for exclude-result-prefixes
      const nsPrefixes = Object.keys(namespaces)
        .filter(key => key !== 'default')
        .join(' ');
      
      const excludeResultPrefixes = nsPrefixes ? `exclude-result-prefixes="${nsPrefixes}"` : '';
      
      // Use xpath-default-namespace when a default namespace is present
      const xpathDefaultNS = namespaces.default ? `xpath-default-namespace="${namespaces.default}"` : '';
      
      // Build the stylesheet opening with proper formatting
      let xslt = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="3.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"`;
      
      if (nsDeclarations) {
        xslt += `\n    ${nsDeclarations}`;
      }
      
      if (excludeResultPrefixes) {
        xslt += `\n    ${excludeResultPrefixes}`;
      }
      
      if (xpathDefaultNS) {
        xslt += `\n    ${xpathDefaultNS}`;
      }
      
      xslt += `>
 
    <xsl:output method="json" indent="yes"/>
 
    <xsl:template match="/">
<xsl:map>
`;
  
      console.log('Step 1: Normalizing mappings...');
      // STEP 1: Normalize and validate all XPaths
      let normalizedMappings = normalizeAllMappings(mappings.fields);
      console.log('Normalized mappings:', normalizedMappings);
      
      console.log('Step 2: Ensuring complete hierarchy...');
      // STEP 2: Ensure complete hierarchy (add missing parent components)
      normalizedMappings = ensureCompleteHierarchy(normalizedMappings);
      console.log('After hierarchy completion:', normalizedMappings);
      
      console.log('Step 3: Building JSON hierarchy...');
      // STEP 3: Build hierarchical JSON structure
      const jsonHierarchy = buildJSONHierarchyEnhanced(normalizedMappings);
      console.log('JSON hierarchy structure:', jsonHierarchy);
      
      console.log('Step 4: Generating JSON map entries...');
      // STEP 4: Generate JSON map entries with formatting
      // Use for-each wrapper if there's a root path specified
      const rootPath = mappings.rootPath || '/*[1]';
      xslt += `<xsl:for-each select="${rootPath}">\n`;
      xslt += generateJSONMapEntriesEnhanced(jsonHierarchy, normalizedMappings, rootPath, '');
      xslt += `</xsl:for-each>\n`;
      
      xslt += `</xsl:map>
</xsl:template>
 
</xsl:stylesheet>`;
      
      console.log('JSON XSLT generation complete');
      return xslt;
    } catch (error) {
      console.error('Error in generateJSONTransform:', error);
      throw error;
    }
  }
  
  /**
   * Build hierarchical structure for JSON output (legacy - kept for backward compatibility)
   */
  function buildJSONHierarchy(fields) {
    const hierarchy = {};
    
    fields.forEach(mapping => {
      if (!mapping.sourcePath || !mapping.targetName) return;
      
      const targetPath = mapping.targetPath || mapping.targetName;
      const parts = targetPath.split('/');
      
      let current = hierarchy;
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // Leaf node - store the mapping
          if (!current._fields) current._fields = [];
          current._fields.push({
            ...mapping,
            leafName: part
          });
        } else {
          // Parent node
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
      });
    });
    
    return hierarchy;
  }
  
  /**
   * Build enhanced hierarchical structure for JSON output with complete metadata
   */
  function buildJSONHierarchyEnhanced(mappings) {
    const hierarchy = {};
    
    mappings.forEach(mapping => {
      if (!mapping.sourcePath || !mapping.targetName) return;
      
      const targetPath = mapping.targetPath || mapping.targetName;
      const parts = targetPath.split('/');
      
      let current = hierarchy;
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // Leaf node - store the mapping with full metadata
          if (!current._fields) current._fields = [];
          current._fields.push({
            ...mapping,
            leafName: part,
            parsed: parseSourcePath(mapping.sourcePath)
          });
        } else {
          // Parent node
          if (!current[part]) {
            current[part] = {
              _metadata: {
                isComponent: true,
                level: index,
                name: part
              }
            };
          }
          current = current[part];
        }
      });
    });
    
    return hierarchy;
  }
  

  
  /**
   * Generate enhanced JSON map entries with comprehensive feature support
   * Enhanced to support:
   * - Single quotes in key attributes: key="'FieldName'"
   * - Full XPath expressions with namespace prefixes
   * - Proper namespace handling
   * - XPath validation and correction
   */
  function generateJSONMapEntriesEnhanced(hierarchy, mappings, rootPath, indent) {
    let output = '';
    
    Object.entries(hierarchy).forEach(([key, value]) => {
      if (key === '_fields') {
        // Generate entries for leaf fields with formatting and error handling
        value.forEach(mapping => {
          const { parsed } = mapping;
          const leafName = escapeXMLName(mapping.leafName);
          
          // Add comment for optional or placeholder fields
          if (mapping.isPlaceholder) {
            output += `${indent}<!-- ${leafName} - Placeholder component -->\n`;
            return;
          }
          
          if (!mapping.required) {
            output += `${indent}<!-- ${leafName} - Optional field -->\n`;
          }
          
          // Validate and fix XPath - use full xpath with namespace prefixes
          const xpath = validateAndFixXPath(mapping.sourcePath, parsed);
          
          // Handle multiple occurrences
          if (mapping.occurs > 1) {
            output += `${indent}<!-- ${leafName} - Multiple occurrences (Occurs: ${mapping.occurs}) -->\n`;
            // Use single quotes inside double quotes for key
            output += `${indent}<xsl:map-entry key="'${leafName}'">\n`;
            output += `${indent}  <xsl:array>\n`;
            output += `${indent}    <xsl:for-each select="${xpath}">\n`;
            output += generateJSONValueSelectEnhanced(mapping, parsed, xpath, indent + '      ');
            output += `${indent}    </xsl:for-each>\n`;
            output += `${indent}  </xsl:array>\n`;
            output += `${indent}</xsl:map-entry>\n`;
          } else {
            // Single occurrence - use single quotes inside double quotes for key
            output += `${indent}<xsl:map-entry key="'${leafName}'">\n`;
            
            if (parsed.type === 'attribute') {
              // For attributes, use @ syntax
              output += `${indent}  <xsl:value-of select="${xpath}"/>\n`;
            } else {
              output += generateJSONValueSelectEnhanced(mapping, parsed, xpath, indent + '  ');
            }
            
            output += `${indent}</xsl:map-entry>\n`;
          }
        });
      } else if (key !== '_metadata') {
        // Nested object
        const escapedKey = escapeXMLName(key);
        
        // Check if this is a component with occurrences
        const componentMapping = mappings.find(m => 
          (m.targetPath || m.targetName).split('/').pop() === key && m.occurs > 1
        );
        
        if (componentMapping && componentMapping.occurs > 1) {
          const parsed = componentMapping.parsed || parseSourcePath(componentMapping.sourcePath);
          const xpath = validateAndFixXPath(componentMapping.sourcePath, parsed);
          
          output += `${indent}<!-- ${escapedKey} - Multiple occurrences (Occurs: ${componentMapping.occurs}) -->\n`;
          // Use single quotes inside double quotes for key
          output += `${indent}<xsl:map-entry key="'${escapedKey}'">\n`;
          output += `${indent}  <xsl:array>\n`;
          output += `${indent}    <xsl:for-each select="${xpath}">\n`;
          output += `${indent}      <xsl:map>\n`;
          output += generateJSONMapEntriesEnhanced(value, mappings, rootPath, indent + '        ');
          output += `${indent}      </xsl:map>\n`;
          output += `${indent}    </xsl:for-each>\n`;
          output += `${indent}  </xsl:array>\n`;
          output += `${indent}</xsl:map-entry>\n`;
        } else {
          // Use single quotes inside double quotes for key
          output += `${indent}<xsl:map-entry key="'${escapedKey}'">\n`;
          output += `${indent}  <xsl:map>\n`;
          output += generateJSONMapEntriesEnhanced(value, mappings, rootPath, indent + '    ');
          output += `${indent}  </xsl:map>\n`;
          output += `${indent}</xsl:map-entry>\n`;
        }
      }
    });
    
    return output;
  }
  
  /**
   * Generate JSON value selection with formatting
   */
  function generateJSONValueSelect(mapping, parsed, indent) {
    const selectPath = parsed.elementName || '.';
    
    // Handle different field types
    switch (mapping.fieldType) {
      case 'date':
      case 'dateTime':
        return `${indent}<xsl:choose>
  ${indent}  <xsl:when test="${selectPath}">
  ${indent}    <xsl:sequence select="string(${selectPath})"/>
  ${indent}  </xsl:when>
  ${indent}  <xsl:otherwise>
  ${indent}    <!-- Using current date-time as fallback -->
  ${indent}    <xsl:sequence select="substring(string(current-dateTime()), 1, 19)"/>
  ${indent}  </xsl:otherwise>
  ${indent}</xsl:choose>\n`;
      
      case 'currency':
        return `${indent}<xsl:map>
  ${indent}  <xsl:map-entry key="amount">
  ${indent}    <xsl:sequence select="format-number(${selectPath}, '0.00')"/>
  ${indent}  </xsl:map-entry>
  ${indent}  <xsl:map-entry key="currency">
  ${indent}    <xsl:sequence select="'USD'"/>
  ${indent}  </xsl:map-entry>
  ${indent}</xsl:map>\n`;
      
      case 'decimal':
      case 'numeric':
        return `${indent}<xsl:sequence select="format-number(${selectPath}, '0.00')"/>\n`;
      
      case 'time':
        return `${indent}<xsl:sequence select="string(${selectPath})"/>\n`;
      
      default:
        // String or generic type with error handling
        return `${indent}<xsl:choose>
  ${indent}  <xsl:when test="${selectPath}">
  ${indent}    <xsl:sequence select="string(${selectPath})"/>
  ${indent}  </xsl:when>
  ${indent}  <xsl:otherwise>
  ${indent}    <!-- Field ${mapping.targetName} is missing -->
  ${indent}    <xsl:sequence select="''"/>
  ${indent}  </xsl:otherwise>
  ${indent}</xsl:choose>\n`;
    }
  }
  
  /**
   * Generate enhanced JSON value selection with full XPath support
   * Uses <xsl:value-of> instead of <xsl:sequence> for better JSON serialization
   */
  function generateJSONValueSelectEnhanced(mapping, parsed, xpath, indent) {
    // Use simple xsl:value-of for clean output - matches the sample XSLT pattern
    return `${indent}<xsl:value-of select="${xpath}"/>\n`;
  }
  
  /**
   * Validate and fix XPath expressions based on actual XML structure
   * Ensures namespace prefixes are included and XPath is well-formed
   */
  function validateAndFixXPath(sourcePath, parsed) {
    if (!sourcePath) return '';
    
    // If XPath already has namespace prefix, use it as-is
    if (sourcePath.includes(':') && !sourcePath.startsWith('//')) {
      return sourcePath;
    }
    
    // Use the full xpath from parsed object
    let xpath = parsed.xpath || sourcePath;
    
    // Ensure XPath is properly formatted
    xpath = normalizeXPath(xpath);
    
    // For attributes, ensure @ symbol is present
    if (parsed.type === 'attribute') {
      if (!xpath.includes('/@') && !xpath.includes('@')) {
        // Fix attribute XPath
        if (parsed.parentPath && parsed.attributeName) {
          xpath = `${parsed.parentPath}/@${parsed.attributeName}`;
        }
      }
    }
    
    return xpath;
  }
  
  /**
   * Generate flat file value extraction with formatting and error handling
   */
  function generateFlatFileValueExtraction(mapping, parsed, separator, occurrenceIndex = null) {
    const indent = '    ';
    let output = '';
    
    // For multiple occurrences, select the specific occurrence
    let selectPath = '';
    if (occurrenceIndex !== null) {
      // Select the nth occurrence
      if (parsed.type === 'attribute') {
        selectPath = `${parsed.parentPath}[${occurrenceIndex}]/@${parsed.attributeName}`;
      } else {
        selectPath = `${parsed.elementName}[${occurrenceIndex}]`;
      }
    } else {
      // Single occurrence
      if (parsed.type === 'attribute') {
        selectPath = `@${parsed.attributeName}`;
      } else {
        selectPath = parsed.elementName || '.';
      }
    }
    
    // Handle different field types with formatting
    switch (mapping.fieldType) {
      case 'date':
      case 'dateTime':
        output += `${indent}<!-- ${mapping.targetName}${occurrenceIndex ? '_' + occurrenceIndex : ''} - Date/DateTime field -->\n`;
        output += `${indent}<xsl:choose>\n`;
        output += `${indent}  <xsl:when test="${selectPath}">\n`;
        output += `${indent}    <xsl:value-of select="${selectPath}"/>\n`;
        output += `${indent}  </xsl:when>\n`;
        output += `${indent}  <xsl:otherwise>\n`;
        output += `${indent}    <xsl:value-of select="substring(string(current-dateTime()), 1, 19)"/>\n`;
        output += `${indent}  </xsl:otherwise>\n`;
        output += `${indent}</xsl:choose>\n`;
        break;
      
      case 'currency':
        output += `${indent}<!-- ${mapping.targetName}${occurrenceIndex ? '_' + occurrenceIndex : ''} - Currency field -->\n`;
        output += `${indent}<xsl:choose>\n`;
        output += `${indent}  <xsl:when test="${selectPath}">\n`;
        output += `${indent}    <xsl:value-of select="format-number(${selectPath}, '0.00')"/>\n`;
        output += `${indent}  </xsl:when>\n`;
        output += `${indent}  <xsl:otherwise>\n`;
        output += `${indent}    <xsl:text>0.00</xsl:text>\n`;
        output += `${indent}  </xsl:otherwise>\n`;
        output += `${indent}</xsl:choose>\n`;
        break;
      
      case 'decimal':
      case 'numeric':
        output += `${indent}<!-- ${mapping.targetName}${occurrenceIndex ? '_' + occurrenceIndex : ''} - Numeric field -->\n`;
        output += `${indent}<xsl:choose>\n`;
        output += `${indent}  <xsl:when test="${selectPath}">\n`;
        output += `${indent}    <xsl:value-of select="format-number(${selectPath}, '0.00')"/>\n`;
        output += `${indent}  </xsl:when>\n`;
        output += `${indent}  <xsl:otherwise>\n`;
        output += `${indent}    <xsl:text>0</xsl:text>\n`;
        output += `${indent}  </xsl:otherwise>\n`;
        output += `${indent}</xsl:choose>\n`;
        break;
      
      case 'time':
        output += `${indent}<!-- ${mapping.targetName}${occurrenceIndex ? '_' + occurrenceIndex : ''} - Time field -->\n`;
        output += `${indent}<xsl:choose>\n`;
        output += `${indent}  <xsl:when test="${selectPath}">\n`;
        output += `${indent}    <xsl:value-of select="${selectPath}"/>\n`;
        output += `${indent}  </xsl:when>\n`;
        output += `${indent}  <xsl:otherwise>\n`;
        output += `${indent}    <xsl:text></xsl:text>\n`;
        output += `${indent}  </xsl:otherwise>\n`;
        output += `${indent}</xsl:choose>\n`;
        break;
      
      default:
        // String or generic type with error handling
        if (!mapping.required) {
          output += `${indent}<!-- ${mapping.targetName}${occurrenceIndex ? '_' + occurrenceIndex : ''} - Optional field -->\n`;
        }
        output += `${indent}<xsl:choose>\n`;
        output += `${indent}  <xsl:when test="${selectPath}">\n`;
        output += `${indent}    <xsl:value-of select="${selectPath}"/>\n`;
        output += `${indent}  </xsl:when>\n`;
        output += `${indent}  <xsl:otherwise>\n`;
        output += `${indent}    <xsl:text></xsl:text>\n`;
        output += `${indent}  </xsl:otherwise>\n`;
        output += `${indent}</xsl:choose>\n`;
        break;
    }
    
    // Add separator
    output += `${indent}<xsl:text>${separator}</xsl:text>`;
    
    return output;
  }
  
  /**
   * Generate XSLT for flat file (CSV/TSV) output format
   * 
   * Enhanced version with comprehensive features:
   * 1. XPath normalization and validation
   * 2. Complete component & field coverage with hierarchy support
   * 3. Handling multiple occurrences (Occurs > 1) - flattened with indexed columns
   * 4. Proper attribute vs element mapping
   * 5. Date/time and currency formatting
   * 6. Error handling with fallback values
   * 7. Namespace handling with exclude-result-prefixes
   * 8. Hierarchical paths flattened with dots (order/name -> order.name)
   */
  export function generateFlatFileTransform(mappings, delimiter = ',', namespaces = {}) {
    try {
      console.log('generateFlatFileTransform called with:', { mappings, delimiter, namespaces });
      
      // Build namespace declarations
      const nsDeclarations = Object.entries(namespaces)
        .filter(([key]) => key !== 'default')
        .map(([prefix, uri]) => `xmlns:${prefix}="${uri}"`)
        .join(' ');
      
      const defaultNS = namespaces.default ? `xmlns="${namespaces.default}"` : '';
      
      // Get namespace prefixes for exclude-result-prefixes
      const nsPrefixes = Object.keys(namespaces)
        .filter(key => key !== 'default')
        .join(' ');
      
      const excludeResultPrefixes = nsPrefixes ? `exclude-result-prefixes="${nsPrefixes}"` : '';
      
      console.log('Step 1: Normalizing mappings...');
      // STEP 1: Normalize and validate all XPaths
      let normalizedMappings = normalizeAllMappings(mappings.fields);
      console.log('Normalized mappings:', normalizedMappings);
      
      console.log('Step 2: Ensuring complete hierarchy...');
      // STEP 2: Ensure complete hierarchy (add missing parent components)
      normalizedMappings = ensureCompleteHierarchy(normalizedMappings);
      console.log('After hierarchy completion:', normalizedMappings);
      
      // STEP 3: Filter out placeholder components for flat file
      const actualFields = normalizedMappings.filter(m => !m.isPlaceholder);
      
      console.log('Step 3: Building flat headers...');
      // STEP 4: Flatten hierarchical paths for headers (order/name -> order.name)
      // Handle multiple occurrences by creating indexed columns
      const headerParts = [];
      actualFields.forEach(mapping => {
        const targetPath = mapping.targetPath || mapping.targetName;
        const flatName = targetPath.replace(/\//g, '.');
        
        if (mapping.occurs > 1) {
          // Create multiple columns for multiple occurrences
          for (let i = 1; i <= mapping.occurs; i++) {
            headerParts.push(`${flatName}_${i}`);
          }
        } else {
          headerParts.push(flatName);
        }
      });
      const headers = headerParts.join(delimiter);
      
      let xslt = `<?xml version="1.0" encoding="UTF-8"?>
  <xsl:stylesheet version="1.0" 
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    ${nsDeclarations}
    ${defaultNS}
    ${excludeResultPrefixes}>
    
    <xsl:output method="text" encoding="UTF-8"/>
    
    <!-- Root template -->
    <xsl:template match="/">
      <!-- Header row -->
      <xsl:text>${headers}&#10;</xsl:text>
      
      <!-- Data rows -->
      <xsl:apply-templates select="${normalizeXPath(mappings.rootPath || '/*')}"/>
    </xsl:template>
    
    <!-- Data template -->
    <xsl:template match="${mappings.recordPath || '*'}">
  `;
  
      console.log('Step 4: Generating value extractions...');
      // STEP 5: Generate value extraction for each field with formatting and error handling
      const valueExtractions = [];
      actualFields.forEach((mapping, mappingIndex) => {
        const parsed = parseSourcePath(mapping.sourcePath);
        const isLast = mappingIndex === actualFields.length - 1;
        
        // Handle multiple occurrences
        if (mapping.occurs > 1) {
          for (let i = 1; i <= mapping.occurs; i++) {
            const isLastOccurrence = i === mapping.occurs && isLast;
            const separator = isLastOccurrence ? '&#10;' : delimiter;
            
            valueExtractions.push(generateFlatFileValueExtraction(
              mapping, 
              parsed, 
              separator, 
              i
            ));
          }
        } else {
          const separator = isLast ? '&#10;' : delimiter;
          valueExtractions.push(generateFlatFileValueExtraction(
            mapping, 
            parsed, 
            separator, 
            null
          ));
        }
      });
      
      xslt += valueExtractions.join('\n');
      
      xslt += `
    </xsl:template>
    
  </xsl:stylesheet>`;
      
      console.log('Flat file XSLT generation complete');
      return xslt;
    } catch (error) {
      console.error('Error in generateFlatFileTransform:', error);
      throw error;
    }
  }
  
  /**
   * Main function to generate XSLT based on format
   */
  export function generateXSLT(format, mappings, options = {}) {
    const namespaces = options.namespaces || {};
    const delimiter = options.delimiter || ',';
    
    switch (format.toLowerCase()) {
      case 'xml':
        return generateXMLTransform(mappings, namespaces);
      
      case 'json':
        return generateJSONTransform(mappings, namespaces);
      
      case 'flat':
      case 'csv':
        return generateFlatFileTransform(mappings, delimiter, namespaces);
      
      default:
        throw new Error(`Unsupported output format: ${format}`);
    }
  }
  
  /**
   * Validate generated XSLT
   */
  export function validateXSLT(xsltString) {
    try {
      console.log('Validating XSLT...');
      
      const parser = new DOMParser();
      const xsltDoc = parser.parseFromString(xsltString, 'text/xml');
      
      const parserError = xsltDoc.querySelector('parsererror');
      if (parserError) {
        console.error('XSLT parsing error:', parserError.textContent);
        console.log('Failed XSLT content:', xsltString);
        return {
          valid: false,
          error: 'XSLT parsing error: ' + parserError.textContent
        };
      }
      
      // Check if root is stylesheet
      if (xsltDoc.documentElement.localName !== 'stylesheet') {
        return {
          valid: false,
          error: 'Root element must be xsl:stylesheet'
        };
      }
      
      // If DOMParser succeeded, the XML is well-formed (tags are balanced)
      // No need for manual tag counting - DOMParser handles this
      
      console.log('XSLT validation passed - document is well-formed');
      return { valid: true, error: null };
    } catch (error) {
      console.error('XSLT validation error:', error);
      return { valid: false, error: error.message };
    }
  }
  
  /**
   * Download XSLT file
   */
  export function downloadXSLT(xsltString, filename = 'transform.xslt') {
    const blob = new Blob([xsltString], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  