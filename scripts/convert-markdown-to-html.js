/**
 * Convert markdown files to HTML with grouped navigation
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// marked options
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: true,
  mangle: false,
  headerPrefix: ''
});

// Menu structure with groups and submenus
const menuStructure = [
  {
    title: 'Getting Started',
    items: [
      { path: 'index.html', title: 'Home' },
      { path: 'node-library.html', title: 'Node Library' }
    ]
  },
  {
    title: 'Core Systems',
    items: [
      { path: 'NODE-REGISTRY.html', title: 'Node Registry' },
      { path: 'FEATURES-SUMMARY.html', title: 'Features Summary' }
    ]
  },
  {
    title: 'Custom Nodes',
    items: [
      { path: 'CUSTOM-NODE-SYSTEM-PROPOSAL.html', title: 'System Proposal' },
      { path: 'CUSTOM-NODES-DESIGN.html', title: 'Design' },
      { path: 'CUSTOM-NODES-IMPLEMENTATION.html', title: 'Implementation' },
      { path: 'CUSTOM-NODES-SUMMARY.html', title: 'Summary' }
    ]
  },
  {
    title: 'Graph Editor',
    items: [
      { path: 'GRAPH-EDITOR.html', title: 'Overview' },
      { path: 'GRAPH-EDITOR-IMPLEMENTATION.html', title: 'Implementation' },
      { path: 'GRAPH-EDITOR-REACT-FLOW.html', title: 'React Flow Migration' },
      { path: 'GRAPH-EDITOR-SUMMARY.html', title: 'Quick Start' },
      { path: 'GRAPH-EXECUTE-PAGE.html', title: 'Execute Page' },
      { path: 'GRAPH-MANAGEMENT-SYSTEM.html', title: 'Management System' },
      { path: 'GRAPHS-PAGE-IMPROVEMENTS.html', title: 'Improvements' }
    ]
  },
  {
    title: 'Live Execution',
    items: [
      { path: 'LIVE-GRAPH-EXECUTION-PROPOSAL.html', title: 'Proposal' },
      { path: 'LIVE-GRAPH-EXECUTION-PHASE1-IMPLEMENTATION.html', title: 'Phase 1' },
      { path: 'LIVE-GRAPH-EXECUTION-PHASE2-DESIGN.html', title: 'Phase 2 - Design' },
      { path: 'LIVE-GRAPH-EXECUTION-PHASE2-IMPLEMENTATION.html', title: 'Phase 2 - Implementation' },
      { path: 'LIVE-GRAPH-EXECUTION-PHASE2-COMPLETE.html', title: 'Phase 2 - Complete' },
      { path: 'LIVE-GRAPH-EXECUTION-PHASE3-DESIGN.html', title: 'Phase 3 - Design' },
      { path: 'LIVE-GRAPH-EXECUTION-PHASE3-IMPLEMENTATION.html', title: 'Phase 3 - Implementation' },
      { path: 'LIVE-GRAPH-EXECUTION-PHASE3-COMPLETE.html', title: 'Phase 3 - Complete' }
    ]
  },
  {
    title: 'Error Handling & Logging',
    items: [
      { path: 'ERROR-HANDLING.html', title: 'Error Handling' },
      { path: 'ERROR-HANDLING-SUMMARY.html', title: 'Error Handling Summary' },
      { path: 'LOGGING.html', title: 'Logging' }
    ]
  },
  {
    title: 'Advanced Topics',
    items: [
      { path: 'INTERACTIVE-NODES-PROPOSAL.html', title: 'Interactive Nodes' },
      { path: 'TEST-GRAPH-LIVE-EXECUTION.html', title: 'Test Graph' },
      { path: 'IMPROVEMENTS-PROPOSAL.html', title: 'Improvements' },
      { path: 'WEBASSEMBLY-OPPORTUNITIES.html', title: 'WebAssembly' }
    ]
  }
];

// Extract headers from HTML content
function extractHeaders(html) {
  // Try to match headers with IDs first
  let headerRegex = /<h([2-4])[^>]*id="([^"]+)"[^>]*>(.*?)<\/h[2-4]>/gi;
  const headers = [];
  let match;
  
  // First pass: headers with IDs
  while ((match = headerRegex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const id = match[2];
    const text = match[3].replace(/<[^>]+>/g, ''); // Remove HTML tags from text
    
    headers.push({ level, id, text });
  }
  
  // Second pass: headers without IDs - generate IDs from text
  headerRegex = /<h([2-4])[^>]*>(.*?)<\/h[2-4]>/gi;
  const processedIds = new Set(headers.map(h => h.id));
  
  while ((match = headerRegex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const text = match[2].replace(/<[^>]+>/g, ''); // Remove HTML tags from text
    const id = text.toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
    
    // Only add if not already processed and ID is valid
    if (id && !processedIds.has(id)) {
      processedIds.add(id);
      headers.push({ level, id, text });
      
      // Add ID to the header in HTML if it doesn't have one
      const headerTag = match[0];
      if (!headerTag.includes('id=')) {
        html = html.replace(headerTag, headerTag.replace(/<h([2-4])/, `<h$1 id="${id}"`));
      }
    }
  }
  
  return { headers, html };
}

// Generate table of contents HTML
function generateTOC(headers) {
  if (headers.length === 0) {
    return '';
  }
  
  let tocHtml = '<div class="toc-sidebar">\n';
  tocHtml += '    <h3>On This Page</h3>\n';
  tocHtml += '    <ul class="toc-menu">\n';
  
  headers.forEach(header => {
    const className = header.level === 2 ? 'toc-h2' : header.level === 3 ? 'toc-h3' : 'toc-h4';
    tocHtml += `      <li class="${className}"><a href="#${header.id}">${header.text}</a></li>\n`;
  });
  
  tocHtml += '    </ul>\n';
  tocHtml += '</div>\n';
  
  return tocHtml;
}

// Convert markdown to HTML
function markdownToHtml(markdown) {
  // Convert links from .md to .html
  let processedMarkdown = markdown.replace(/\[([^\]]+)\]\(([^)]+\.md)\)/g, (match, text, link) => {
    const htmlLink = link.replace(/\.md$/, '.html');
    return `[${text}](${htmlLink})`;
  });
  
  // Convert to HTML
  const html = marked.parse(processedMarkdown);
  
  return html;
}

// Generate navigation HTML with groups
function generateNavigation(currentPath) {
  let navHtml = '';
  
  // Find which group contains the active page
  let activeGroupIndex = -1;
  menuStructure.forEach((group, index) => {
    if (group.items.some(item => item.path === currentPath)) {
      activeGroupIndex = index;
    }
  });
  
  menuStructure.forEach((group, index) => {
    const isActiveGroup = index === activeGroupIndex;
    const expandedClass = isActiveGroup ? 'expanded' : '';
    
    navHtml += `<li class="nav-group">
      <div class="nav-group-header ${expandedClass}">${group.title}</div>
      <ul class="nav-submenu ${expandedClass}">`;
    
    group.items.forEach(item => {
      const isActive = item.path === currentPath ? 'class="active"' : '';
      navHtml += `        <li><a href="${item.path}" ${isActive}>${item.title}</a></li>\n`;
    });
    
    navHtml += `      </ul>
    </li>`;
  });
  
  return navHtml;
}

// Create HTML template
function createHtmlTemplate(title, content, currentPath) {
  const navHtml = generateNavigation(currentPath);
  const { headers, html: updatedContent } = extractHeaders(content);
  const tocHtml = generateTOC(headers);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - VZ Programming Documentation</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <div class="sidebar">
            <h2>Documentation</h2>
            <ul class="nav-menu">
${navHtml}
            </ul>
        </div>
        <div class="content-wrapper">
            <div class="content">
${updatedContent}
            </div>
${tocHtml}
        </div>
    </div>
    <script>
        // Accordion menu behavior - only one group open at a time
        document.querySelectorAll('.nav-group-header').forEach(header => {
            header.addEventListener('click', function() {
                const submenu = this.nextElementSibling;
                const isExpanded = submenu.classList.contains('expanded');
                
                // Close all other groups
                document.querySelectorAll('.nav-submenu').forEach(menu => {
                    if (menu !== submenu) {
                        menu.classList.remove('expanded');
                    }
                });
                document.querySelectorAll('.nav-group-header').forEach(h => {
                    if (h !== this) {
                        h.classList.remove('expanded');
                    }
                });
                
                // Toggle current group
                if (!isExpanded) {
                    submenu.classList.add('expanded');
                    this.classList.add('expanded');
                } else {
                    submenu.classList.remove('expanded');
                    this.classList.remove('expanded');
                }
            });
        });
        
        // Expand active menu group on page load
        const activeLink = document.querySelector('.nav-menu .active');
        if (activeLink) {
            const navGroup = activeLink.closest('.nav-group');
            if (navGroup) {
                const submenu = navGroup.querySelector('.nav-submenu');
                const header = navGroup.querySelector('.nav-group-header');
                if (submenu && header) {
                    submenu.classList.add('expanded');
                    header.classList.add('expanded');
                }
            }
        }
        
        // Scroll spy for table of contents
        ${headers.length > 0 ? `
        const tocLinks = document.querySelectorAll('.toc-menu a');
        const headers = document.querySelectorAll('.content h2[id], .content h3[id], .content h4[id]');
        
        function updateActiveTOCLink() {
            let current = '';
            headers.forEach(header => {
                const rect = header.getBoundingClientRect();
                if (rect.top <= 100) {
                    current = header.id;
                }
            });
            
            tocLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + current) {
                    link.classList.add('active');
                }
            });
        }
        
        // Update on scroll
        window.addEventListener('scroll', updateActiveTOCLink);
        updateActiveTOCLink();
        
        // Smooth scroll for TOC links
        tocLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    const offset = 80;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
        ` : ''}
    </script>
</body>
</html>`;
}

// Find all markdown files in docs folder
function findMarkdownFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findMarkdownFiles(filePath, fileList);
    } else if (file.endsWith('.md')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Main function
function main() {
  const docsDir = path.join(__dirname, '..', 'docs');
  const markdownFiles = findMarkdownFiles(docsDir);
  
  // Convert each markdown file
  markdownFiles.forEach(mdFile => {
    const content = fs.readFileSync(mdFile, 'utf-8');
    const htmlContent = markdownToHtml(content);
    
    // Generate filename
    const relativePath = path.relative(docsDir, mdFile);
    const htmlFileName = relativePath.replace(/\.md$/, '.html').replace(/\\/g, '/');
    const htmlFilePath = path.join(docsDir, htmlFileName);
    
    // Create directory if needed
    const htmlDir = path.dirname(htmlFilePath);
    if (!fs.existsSync(htmlDir)) {
      fs.mkdirSync(htmlDir, { recursive: true });
    }
    
    // Extract title
    const titleMatch = content.match(/^# (.+)$/m);
    const title = titleMatch ? titleMatch[1] : path.basename(mdFile, '.md');
    
    // Generate HTML
    const html = createHtmlTemplate(title, htmlContent, htmlFileName);
    
    // Save file
    fs.writeFileSync(htmlFilePath, html, 'utf-8');
    console.log(`Converted: ${relativePath} -> ${htmlFileName}`);
  });
  
  console.log(`\n✅ Converted ${markdownFiles.length} markdown files to HTML`);
}

if (require.main === module) {
  main();
}

module.exports = { markdownToHtml, createHtmlTemplate };
