console.log("Running extension");

function waitForMergeFooter(callback) {
  const check = () => {
    const footer = document.querySelector('.p-3.bgColor-muted.borderColor-muted.rounded-bottom-2');
    if (footer) {
      callback(footer);
    } else {
      requestAnimationFrame(check);
    }
  };
  check();
}

waitForMergeFooter((footer) => {
  if (document.querySelector('#tryjobs')) return;

  // Ensure footer is flex row for layout
  footer.style.display = 'flex';
  footer.style.flexWrap = 'wrap';
  footer.style.alignItems = 'center';
  footer.style.justifyContent = 'flex-start';
  footer.style.gap = '8px';

  // Create Tryjobs button
  const button = document.createElement('button');
  button.id = 'tryjobs';
  button.textContent = 'Tryjobs';
  button.className = 'btn btn-sm';
  button.style.backgroundColor = '#2da44e';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '6px';
  button.style.padding = '5px 16px';
  button.style.cursor = 'pointer';

  button.addEventListener('click', () => {
    // --- Create overlay and modal ---
    const overlay = document.createElement('div');
    overlay.id = 'popup-overlay';

    const modal = document.createElement('div');
    modal.id = 'popup-modal';

    const title = document.createElement('h2');
    title.textContent = 'Choose Tryjobs';

    const form = document.createElement('form');

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Filter tryjobs...';
    searchInput.style.marginBottom = '10px';
    searchInput.style.width = '100%';

    const labelList = [];

    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase();
      labelList.forEach(({ label, test }) => {
        label.style.display = test.toLowerCase().includes(query) ? 'block' : 'none';
      });
    });

    fetch('https://bryans-mac-mini.taila3b14e.ts.net/test-names')
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        return response.json();
      })
      .then(data => {
        data.forEach((test) => {
          const label = document.createElement('label');
          label.style.display = 'block';
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.name = test;
          label.appendChild(checkbox);
          label.append(` ${test}`);
          form.appendChild(label);
          labelList.push({ label, test });
        });
      })
      .catch(error => console.error('Fetch error:', error));

    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'cancel-popup';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.type = 'button';
    cancelBtn.addEventListener('click', () => {
      overlay.remove();
    });

    const submitBtn = document.createElement('button');
    submitBtn.id = 'submit-popup';
    submitBtn.textContent = 'Submit';
    submitBtn.type = 'button';
    submitBtn.addEventListener('click', () => {
      const urlParts = window.location.pathname.split('/');
      const prNumber = 37;
      const selected = Array.from(
        form.querySelectorAll('input[type="checkbox"]:checked')
      ).map(cb => cb.name);
      const commitID = "548f60778f536aa8f5076558983df4e92545a396";
      const branch = 'Sailloft';

      console.log('▶️ Triggering run:', { commitID, prNumber, branch, selected });

      const spinner = document.createElement('div');
      spinner.textContent = '⏳ Running tests...';
      spinner.style.position = 'fixed';
      spinner.style.bottom = '20px';
      spinner.style.right = '20px';
      spinner.style.background = '#24292f';
      spinner.style.color = 'white';
      spinner.style.padding = '12px 20px';
      spinner.style.borderRadius = '8px';
      spinner.style.zIndex = 10000;
      document.body.appendChild(spinner);

      fetch('https://bryans-mac-mini.taila3b14e.ts.net/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitID, branch, prNumber, tests: selected }),
      })
        .then(() => {
          const statusText = document.createElement('p');
          let completed = 0;
          const total = selected.length;
          statusText.textContent = `🟡 Subscribed... 0/${total} complete`;
          statusText.style.marginTop = '15px';
          modal.appendChild(statusText);

          const updateList = document.createElement('ul');
          modal.appendChild(updateList);

          // ⏳ Polling loop for updates
          function pollUpdates() {
          fetch(`https://bryans-mac-mini.taila3b14e.ts.net/subscribe_status_update?commitID=${commitID}&prNumber=${prNumber}`)
            .then(res => {
              if (!res.ok) throw new Error(`Status update failed: ${res.status}`);
              return res.json();
            })
            .then(update => {
              const li = document.createElement('li');
              li.textContent = `✔ ${update.testName} → ${update.status}`;
              updateList.appendChild(li);

              completed++;
              statusText.textContent = `🟢 ${completed}/${total} tests complete`;

              if (completed < total) {
                pollUpdates(); // Keep polling
              } else {
                statusText.textContent = `✅ All ${total} tests complete`;
                spinner.remove();
              }
            })
            .catch(err => {
              console.error('Subscription error:', err);
              statusText.textContent = '❌ Subscription failed';
              spinner.style.backgroundColor = '#cb2431';
              setTimeout(() => spinner.remove(), 3000);
            });
        }

          pollUpdates();
        })
        .catch(error => {
          console.error('Error triggering run:', error);
          spinner.textContent = '❌ Error triggering tests!';
          spinner.style.backgroundColor = '#cb2431';
          setTimeout(() => spinner.remove(), 3000);
        });
    });

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

  footer.appendChild(button);

  // Inject CSS styles
  const style = document.createElement('style');
  style.textContent = `
    #popup-overlay {
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }
    #popup-modal {
      background-color: #ffffff;
      padding: 20px;
      border-radius: 8px;
      width: 300px;
      position: relative;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      font-family: sans-serif;
      color: #24292f;
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
      margin: 10px 0px;
    }
  `;
  document.head.appendChild(style);
});

