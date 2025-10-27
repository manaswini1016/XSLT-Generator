# XSLT Generation with Attributes and Variables - Guide

## Overview
The XSLT generator now supports generating XSLT stylesheets with:
- **Element attributes** (hardcoded, dynamic from XPath, or from variables)
- **Top-level variables** for constants
- **Hardcoded values** for elements
- **For-each loops** for repeating sections
- **Empty elements**

## New Mapping Structure

### 1. Top-Level Configuration

```javascript
{
  xsltVersion: '3.0',  // XSLT version (1.0, 2.0, or 3.0)
  
  // Variables defined at stylesheet level
  variables: [
    {
      name: 'DealerNumberID',
      value: '73084'  // Hardcoded value
    },
    {
      name: 'LanguageCode',
      value: 'en-US'
    },
    {
      name: 'SystemVersion',
      xpath: '//header/version'  // Dynamic from XPath
    }
  ],
  
  // Root element configuration
  rootElement: {
    name: 'soapenv:Envelope',
    attributes: [
      {
        name: 'xmlns:soapenv',
        value: 'http://schemas.xmlsoap.org/soap/envelope/',
        isHardcoded: true
      }
    ]
  },
  
  // Field mappings
  fields: [...]
}
```

### 2. Field Mapping with Attributes

Each field/component can now have:

```javascript
{
  targetName: 'ProcessFerrariRepairOrder',
  targetPath: 'ApplicationArea/ProcessFerrariRepairOrder',
  sourcePath: '//root',
  
  // Element attributes
  attributes: [
    {
      name: 'releaseID',
      value: '5.5.4',
      isHardcoded: true  // Hardcoded attribute
    },
    {
      name: 'versionID',
      value: '1.0',
      isHardcoded: true
    },
    {
      name: 'languageCode',
      value: 'LanguageCode',
      isVariable: true  // Use variable reference {$LanguageCode}
    },
    {
      name: 'timestamp',
      xpath: '//header/timestamp',  // Dynamic from XPath {//header/timestamp}
    }
  ],
  
  // Value handling
  valueType: 'xpath',  // Options: 'xpath', 'hardcoded', 'empty'
  hardcodedValue: 'Always',  // Used when valueType is 'hardcoded'
  
  // For-each loop
  forEachPath: '//jobs',  // Creates <xsl:for-each select="//jobs">
  
  occurs: 1,
  fieldType: 'component',
  required: true
}
```

### 3. Value Types

**xpath** (default):
```xml
<ElementName>
  <xsl:value-of select="//path/to/value"/>
</ElementName>
```

**hardcoded**:
```xml
<ElementName>Always</ElementName>
```

**empty**:
```xml
<ElementName/>
```

### 4. Attribute Types

**Hardcoded** (`isHardcoded: true`):
```xml
<Element releaseID="5.5.4"/>
```

**Variable** (`isVariable: true`):
```xml
<Element languageCode="{$LanguageCode}"/>
```

**Dynamic XPath** (`xpath: '...'`):
```xml
<Element timestamp="{//header/timestamp}"/>
```

## Example Mapping Configuration

```javascript
const mappingConfig = {
  xsltVersion: '3.0',
  
  variables: [
    { name: 'DealerNumberID', value: '73084' },
    { name: 'LanguageCode', value: 'en-US' },
    { name: 'SystemVersion', value: '5.5.4' }
  ],
  
  rootElement: {
    name: 'soapenv:Envelope',
    attributes: []
  },
  
  fields: [
    {
      targetName: 'ProcessFerrariRepairOrder',
      targetPath: 'Body/ProcessMessage/payload/content/ProcessFerrariRepairOrder',
      sourcePath: '/root',
      attributes: [
        { name: 'releaseID', value: '5.5.4', isHardcoded: true },
        { name: 'versionID', value: '1.0', isHardcoded: true },
        { name: 'systemEnvironmentCode', value: 'Production', isHardcoded: true },
        { name: 'languageCode', value: 'LanguageCode', isVariable: true }
      ],
      fieldType: 'component'
    },
    {
      targetName: 'DocumentID',
      targetPath: 'ApplicationArea/DocumentIdentification/DocumentID',
      sourcePath: '//header/repairOrderNumber',
      valueType: 'xpath',
      fieldType: 'string'
    },
    {
      targetName: 'PriceCode',
      targetPath: 'Price/PriceCode',
      sourcePath: '',
      valueType: 'hardcoded',
      hardcodedValue: 'Total',
      fieldType: 'string'
    },
    {
      targetName: 'Job',
      targetPath: 'FerrariRepairOrder/Job',
      sourcePath: '//jobs',
      forEachPath: '//jobs',  // Creates for-each loop
      fieldType: 'component',
      occurs: -1  // Indicates repeating
    },
    {
      targetName: 'JobNumberString',
      targetPath: 'FerrariRepairOrder/Job/JobNumberString',
      sourcePath: 'sourceId',  // Relative path inside for-each
      valueType: 'xpath',
      fieldType: 'string'
    }
  ]
};
```

## Generated XSLT Output

The above configuration generates:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="3.0" 
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">

  <xsl:output method="xml" encoding="UTF-8" indent="yes"/>

  <!-- Define top-level variables for constants -->
  <xsl:variable name="DealerNumberID" select="'73084'"/>
  <xsl:variable name="LanguageCode" select="'en-US'"/>
  <xsl:variable name="SystemVersion" select="'5.5.4'"/>

  <xsl:template match="/">
    <soapenv:Envelope>
      <Body>
        <ProcessMessage>
          <payload>
            <content>
              <ProcessFerrariRepairOrder 
                releaseID="5.5.4" 
                versionID="1.0" 
                systemEnvironmentCode="Production" 
                languageCode="{$LanguageCode}">
                <ApplicationArea>
                  <DocumentIdentification>
                    <DocumentID>
                      <xsl:value-of select="//header/repairOrderNumber"/>
                    </DocumentID>
                  </DocumentIdentification>
                </ApplicationArea>
                <Price>
                  <PriceCode>Total</PriceCode>
                </Price>
                <FerrariRepairOrder>
                  <!-- Job - For-each loop -->
                  <xsl:for-each select="//jobs">
                    <Job>
                      <JobNumberString>
                        <xsl:value-of select="sourceId"/>
                      </JobNumberString>
                    </Job>
                  </xsl:for-each>
                </FerrariRepairOrder>
              </ProcessFerrariRepairOrder>
            </content>
          </payload>
        </ProcessMessage>
      </Body>
    </soapenv:Envelope>
  </xsl:template>

</xsl:stylesheet>
```

## UI Requirements

### 1. Variables Section
Add a section to define stylesheet-level variables:
- **Variable Name** input
- **Variable Value** input
- **Variable XPath** input (mutually exclusive with value)
- Add/Remove buttons

### 2. Root Element Configuration
- **Root Element Name** input
- **Root Element Attributes** list with:
  - Attribute Name
  - Attribute Value
  - Type selector: Hardcoded / Variable / XPath

### 3. Enhanced Field Mapping
For each field, add:

**Attributes Section:**
- Add Attribute button
- For each attribute:
  - Name input
  - Type selector: Hardcoded / Variable / XPath
  - Value input (changes based on type)

**Value Type Section:**
- Radio buttons: XPath / Hardcoded / Empty
- XPath input (when XPath selected)
- Hardcoded Value textarea (when Hardcoded selected)

**For-Each Section:**
- Checkbox: "Is Repeating Element"
- For-Each XPath input

### 4. XSLT Version Selector
- Dropdown: 1.0 / 2.0 / 3.0

## Backward Compatibility

The generator maintains backward compatibility:
- If no `attributes` array is provided, no attributes are added
- If no `valueType` is specified, defaults to 'xpath'
- If no `variables` array is provided, no variables are generated
- If no `forEachPath` is specified, uses `occurs > 1` logic

## Testing

Test the generator with various combinations:
1. Simple elements with hardcoded values
2. Elements with multiple attribute types
3. Nested for-each loops
4. Variables with hardcoded and XPath values
5. Mix of all features

## Migration Notes

Existing mappings will continue to work without changes. To use new features:
1. Add `xsltVersion` to mappings object
2. Add `variables` array for stylesheet variables
3. Add `rootElement` configuration
4. Add `attributes` array to fields that need them
5. Set `valueType` for hardcoded or empty elements
6. Set `forEachPath` for repeating sections
