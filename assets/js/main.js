// Main JavaScript for bakery-street-project.github.io

document.addEventListener('DOMContentLoaded', function() {
  // Add smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Add copy-to-clipboard for code blocks
  document.querySelectorAll('pre code').forEach(block => {
    const button = document.createElement('button');
    button.className = 'copy-button';
    button.textContent = 'Copy';
    button.style.cssText = 'position: absolute; top: 5px; right: 5px; padding: 4px 8px; font-size: 0.75rem; cursor: pointer; background: #f4f4f4; border: 1px solid #ccc; border-radius: 3px;';
    block.parentElement.style.position = 'relative';
    block.parentElement.appendChild(button);

    button.addEventListener('click', async () => {
      await navigator.clipboard.writeText(block.textContent);
      button.textContent = 'Copied!';
      setTimeout(() => { button.textContent = 'Copy'; }, 2000);
    });
  });
});
