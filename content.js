// Log to console to confirm the extension is running
console.log("Running extension");

// Helper function to wait for the GitHub merge footer to load before injecting UI
function waitForMergeFooter(callback) {
  const check = () => {
    // Targeting the PR footer element
    const footer = document.querySelector('.p-3.bgColor-muted.borderColor-muted.rounded-bottom-2');
    if (footer) {
      callback(footer); // Call your UI injection function
    } else {
      requestAnimationFrame(check); // Keep checking until it appears
    }
  };
  check();
}

waitForMergeFooter((footer) => {
  // Prevent adding the button multiple times
  if (document.querySelector('#tryjobs')) return;

  // Style the footer so it can fit your custom button
  footer.style.display = 'flex';
  footer.style.flexWrap = 'wrap';
  footer.style.alignItems = 'center';
  footer.style.justifyContent = 'flex-start';
  footer.style.gap = '8px';

  // Create the green "Tryjobs" button
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

  // Button click handler — opens modal
  button.addEventListener('click', () => {
    // Create the dark overlay
    const overlay = document.createElement('div');
    overlay.id = 'popup-overlay';

    // Create the white modal box
    const modal = document.createElement('div');
    modal.id = 'popup-modal';

    // Modal title
    const title = document.createElement('h2');
    title.textContent = 'Choose Tryjobs';

    // The form to hold checkboxes
    const form = document.createElement('form');

    // Search box to filter tryjobs
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Filter tryjobs...';
    searchInput.style.marginBottom = '10px';
    searchInput.style.width = '100%';

    const labelList = []; // Track labels for filtering

    // Filter labels when user types
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase();
      labelList.forEach(({ label, test }) => {
        label.style.display = test.toLowerCase().includes(query) ? 'block' : 'none';
      });
    });

    // Fetch available tryjob names from backend
    fetch('https://bryans-mac-mini.taila3b14e.ts.net/test-names')
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        return response.json();
      })
      .then(data => {
        data.forEach((test) => {
          // Create checkbox for each test
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

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'cancel-popup';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.type = 'button';
    cancelBtn.addEventListener('click', () => {
      overlay.remove(); // Close the modal
    });

    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.id = 'submit-popup';
    submitBtn.textContent = 'Submit';
    submitBtn.type = 'button';
    submitBtn.addEventListener('click', () => {
      // Extract test selections
      const selected = Array.from(
        form.querySelectorAll('input[type="checkbox"]:checked')
      ).map(cb => cb.name);

      // Hardcoded PR number, commit ID, and branch (this should be dynamic ideally)
      const urlParts = window.location.pathname.split('/');
      const prNumber = "37";
      const commitID = "548f60778f536aa8f5076558983df4e92545a396";
      const branch = 'Sailloft';

      console.log('▶️ Triggering run:', { commitID, prNumber, branch, selected });

      // Spinner while tests are running
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

      // Trigger backend to run tests
      fetch('https://bryans-mac-mini.taila3b14e.ts.net/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitID, branch, prNumber, tests: selected }),
      })
        .then(() => {
          // UI for tracking test status
          const statusText = document.createElement('p');
          let completed = 0;
          const total = selected.length;
          statusText.textContent = `🟡 Subscribed... 0/${total} complete`;
          statusText.style.marginTop = '15px';
          modal.appendChild(statusText);

          const updateList = document.createElement('ul');
          modal.appendChild(updateList);

          const eventSource = new EventSource(`https://bryans-mac-mini.taila3b14e.ts.net/subscribe_status_update?commitID=${commitID}&prNumber=${prNumber}`);

          eventSource.onmessage = (event) => {
            const update = JSON.parse(event.data);
            console.log(update);
            const li = document.createElement('li');
            li.textContent = `✔ ${update.testName} → ${update.status}`;
            updateList.appendChild(li);

            completed++;
            statusText.textContent = `🟢 ${completed}/${total} tests complete`;

            if (completed >= total) {
              statusText.textContent = `✅ All ${total} tests complete`;
              spinner.remove();
              eventSource.close(); // Close the SSE connection
            }
          };

          eventSource.onerror = (err) => {
            console.error('SSE error:', err);
            statusText.textContent = '❌ Subscription failed';
            spinner.style.backgroundColor = '#cb2431';
            setTimeout(() => spinner.remove(), 3000);
            eventSource.close(); // Close the SSE connection on error
          };

          // // Recursively poll status from backend
          // function pollUpdates() {

          //   fetch(`https://bryans-mac-mini.taila3b14e.ts.net/subscribe_status_update?commitID=${commitID}&prNumber=${prNumber}`)
          //     .then(res => {
          //       if (!res.ok) throw new Error(`Status update failed: ${res.status}`);
          //       return res.json();
          //     })
          //     .then(update => {
          //       // Update UI with test result
          //       const li = document.createElement('li');
          //       li.textContent = `✔ ${update.testName} → ${update.status}`;
          //       updateList.appendChild(li);

          //       completed++;
          //       statusText.textContent = `🟢 ${completed}/${total} tests complete`;

          //       // Continue or finish polling
          //       if (completed < total) {
          //         pollUpdates();
          //       } else {
          //         statusText.textContent = `✅ All ${total} tests complete`;
          //         spinner.remove();
          //       }
          //     })
          //     .catch(err => {
          //       console.error('Subscription error:', err);
          //       statusText.textContent = '❌ Subscription failed';
          //       spinner.style.backgroundColor = '#cb2431';
          //       setTimeout(() => spinner.remove(), 3000);
          //     });
          // }

          // pollUpdates(); // Start polling
        })
        .catch(error => {
          // If /run fails
          console.error('Error triggering run:', error);
          spinner.textContent = '❌ Error triggering tests!';
          spinner.style.backgroundColor = '#cb2431';
          setTimeout(() => spinner.remove(), 3000);
        });
    });

    // Layout row for submit and cancel buttons
    const buttonRow = document.createElement('div');
    buttonRow.style.display = 'flex';
    buttonRow.style.justifyContent = 'space-between';
    buttonRow.style.marginTop = '20px';
    buttonRow.appendChild(submitBtn);
    buttonRow.appendChild(cancelBtn);

    // Add all UI components to modal
    modal.appendChild(title);
    modal.appendChild(document.createElement('hr'));
    modal.appendChild(searchInput);
    modal.appendChild(form);
    modal.appendChild(document.createElement('hr'));
    modal.appendChild(buttonRow);

    // Attach modal to overlay and overlay to document
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  });

  // Add Tryjobs button to footer
  footer.appendChild(button);

  // Inject styling for modal and buttons
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
