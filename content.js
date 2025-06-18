console.js("Running extension");

function injectButton() {
  const readme = document.querySelector('#readme');

  if (!readme || document.querySelector('#custom-readme-button')) return;

  const button = document.createElement('button');
  button.innerText = 'Try this project';
  button.id = 'custom-readme-button';
  button.style.cssText = `
    margin-top: 16px;
    padding: 8px 16px;
    background-color: #2da44e;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
  `;

  button.onclick = () => {
    alert('You clicked the custom button!');
    // Or: window.open('https://your-link.com', '_blank');
  };

  readme.appendChild(button); // or use .prepend() if you want it on top
}

// GitHub uses dynamic page loading; use MutationObserver
const observer = new MutationObserver(() => injectButton());
observer.observe(document.body, { childList: true, subtree: true });

injectButton();
