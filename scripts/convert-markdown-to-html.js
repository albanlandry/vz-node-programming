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
  mangle: false
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
  
  menuStructure.forEach(group => {
    navHtml += `<li class="nav-group">
      <div class="nav-group-header">${group.title}</div>
      <ul class="nav-submenu">`;
    
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
            <div class="sidebar-header">
                <h1><a href="index.html">VZ Programming</a></h1>
                <p class="subtitle">Documentation</p>
            </div>
            <ul class="nav-menu">
${navHtml}
            </ul>
        </div>
        <div class="content">
${content}
        </div>
    </div>
    <script>
        // Toggle submenu visibility
        document.querySelectorAll('.nav-group-header').forEach(header => {
            header.addEventListener('click', function() {
                const submenu = this.nextElementSibling;
                submenu.classList.toggle('expanded');
                this.classList.toggle('expanded');
            });
        });
        
        // Expand active menu group
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
