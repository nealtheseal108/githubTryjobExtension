console.log("Running extension");

function injectButton() {
  const tryjobs = document.querySelector('.d-flex.flex-justify-between.mb-md-3');

  if (!tryjobs || document.querySelector('#tryjobs')) return;

  const choose_button = document.createElement('button');
  choose_button.id = 'tryjobs';
  choose_button.setAttribute('type', 'button');
  choose_button.setAttribute('aria-haspopup', 'true');
  choose_button.setAttribute('aria-expanded', 'false');
  choose_button.setAttribute('tabindex', '0');
  choose_button.setAttribute('data-loading', 'false');
  choose_button.setAttribute('data-size', 'medium');
  choose_button.setAttribute('data-variant', 'primary');
  choose_button.setAttribute('aria-describedby', ':myCustomId:');
  choose_button.textContent = 'Tryjobs';
  choose_button.style.cssText = `
    height: 32px;
    max-width: 114px;
    padding: 5px 16px;
    background-color: #2c974b;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    line-height: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    box-sizing: border-box;
    margin-left: 12px; 
  `;
  choose_button.onmouseover = () => {
    choose_button.style.backgroundColor = "#2da44e";
  };

  choose_button.onmouseout = () => {
    choose_button.style.backgroundColor = "#2c974b";
  };

  choose_button.addEventListener('click', () => {
      // --- Create overlay ---
      const overlay = document.createElement('div');
      overlay.id = 'popup-overlay';

      // --- Create modal ---
      const modal = document.createElement('div');
      modal.id = 'popup-modal';

      // Title
      const title = document.createElement('h2');
      title.textContent = 'Choose Tryjobs';

      // Form
      const form = document.createElement('form');

      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.placeholder = 'Filter tryjobs...';
      searchInput.style.marginBottom = '10px';
      searchInput.style.width = '100%';

      searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        labelList.forEach(({ label, test }) => {
          if (test.toLowerCase().includes(query)) {
            label.style.display = 'block';
          } else {
            label.style.display = 'none';
          }
        });
      });

      // Keep references to all label elements
      const labelList = [];

      // Fetch test names and build checkboxes
      fetch('https://bryans-mac-mini.taila3b14e.ts.net/test-names')
        .then(response => {
          if (!response.ok) throw new Error(`HTTP error ${response.status}`);
          return response.json();
        })
        .then(data => {
          data.forEach((test) => {
            const label = document.createElement('label');
            label.style.display = 'block'; // Required for filtering
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = test;
            label.appendChild(checkbox);
            label.append(` ${test}`);
            form.appendChild(label);
            labelList.push({ label, test });
          });
        })
        .catch(error => {
          console.error('Fetch error:', error);
        });

      // Cancel button (bottom right)
      const cancelBtn = document.createElement('button');
      cancelBtn.id = 'cancel-popup';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.type = 'button';
      cancelBtn.addEventListener('click', () => {
        overlay.remove();
      });

      // Submit button (bottom left)
      const submitBtn = document.createElement('button');
      submitBtn.id = 'submit-popup';
      submitBtn.textContent = 'Submit';
      submitBtn.type = 'button';
      // Extract PR number from the URL (e.g., /pull/37 → "37")
      submitBtn.addEventListener('click', () => {
        const urlParts = window.location.pathname.split('/');
        const changeNumber = urlParts.includes("pull") ? urlParts[urlParts.indexOf("pull") + 1] : "0";
      const selected = Array.from(form.querySelectorAll('input[type="checkbox"]:checked'))
                            .map(cb => cb.name);
      console.log('Selected jobs:', selected);

      // Extract commit SHA from the page
      const commitID = document.querySelector('clipboard-copy')?.getAttribute('value') || '';
      const branch = 'main'; // use dynamic logic if needed
      const prNumber = changeNumber;

      fetch('https://bryans-mac-mini.taila3b14e.ts.net/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commitID: commitID,
          branch: branch,
          prNumber: prNumber,
          tests: selected
        }),
      });

      overlay.remove();
    });

      // Add buttons and assemble modal
      const buttonRow = document.createElement('div');
      buttonRow.style.display = 'flex';
      buttonRow.style.justifyContent = 'space-between';
      buttonRow.style.marginTop = '20px';
      buttonRow.appendChild(submitBtn);
      buttonRow.appendChild(cancelBtn);

      modal.appendChild(title);
      modal.appendChild(document.createElement('hr'));
      modal.appendChild(searchInput);
      modal.appendChild(form);
      modal.appendChild(document.createElement('hr'));
      modal.appendChild(buttonRow);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
    });


  tryjobs.appendChild(choose_button);

  const style = document.createElement('style');
    style.textContent = `
    #popup-overlay {
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      background-color: rgba(0, 0, 0, 0.5); /* translucent black overlay */
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }
    #popup-modal {
      background-color: #ffffff; /* bright white modal */
      padding: 20px;
      border-radius: 8px;
      width: 300px;
      position: relative;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      font-family: sans-serif;
      color: #24292f; /* GitHub-style text color */
    }
    #submit-popup, #cancel-popup {
      padding: 6px 12px;
      background-color: #ccc;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    #submit-popup {
      background-color: #3272c1;
      color: white;
    }
    #submit-popup:hover {
      background-color: #255794;
    }
    #cancel-popup:hover {
      background-color: #bbb;
    }
    #popup-modal h2 {
      margin-top: 0;
    }
    hr {
      margin: 10px 0px 10px 0px;
    }
  `;
    document.head.appendChild(style);  
}

// GitHub uses dynamic page loading; use MutationObserver
const observer = new MutationObserver(() => injectButton());
observer.observe(document.body, { childList: true, subtree: true });

injectButton();
