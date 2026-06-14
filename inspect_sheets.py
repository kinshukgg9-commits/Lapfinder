import zipfile
import xml.etree.ElementTree as ET

filename = 'data.xlsx'

with zipfile.ZipFile(filename, 'r') as zip_ref:
    # Read xl/workbook.xml
    workbook_xml = zip_ref.read('xl/workbook.xml')
    root = ET.fromstring(workbook_xml)
    
    # Namespaces are usually present in openxml formats
    namespaces = {
        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
        'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
    }
    
    sheets = root.findall('.//main:sheet', namespaces)
    print("Sheets in the Excel workbook:")
    for sheet in sheets:
        name = sheet.attrib.get('name')
        sheet_id = sheet.attrib.get('sheetId')
        print(f"  - Sheet Name: {name}, Sheet ID: {sheet_id}")
