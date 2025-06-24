// Log to console to confirm the extension is running
console.log("Running extension");

// Helper function to wait for the GitHub merge footer to load before injecting UI
function waitForMergeFooter(callback) {
  const check = () => {
    // Targeting the PR footer element
    const footer = document.querySelector(
      ".p-3.bgColor-muted.borderColor-muted.rounded-bottom-2"
    );
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
  if (document.querySelector("#tryjobs")) return;

  // Style the footer so it can fit your custom button
  footer.style.display = "flex";
  footer.style.flexWrap = "wrap";
  footer.style.alignItems = "center";
  footer.style.justifyContent = "flex-start";
  footer.style.gap = "8px";

  // Create the green "Tryjobs" button
  const button = document.createElement("button");
  button.id = "tryjobs";
  button.textContent = "Tryjobs";
  button.className = "btn btn-sm";
  button.style.backgroundColor = "#2da44e";
  button.style.color = "white";
  button.style.border = "none";
  button.style.borderRadius = "6px";
  button.style.padding = "5px 16px";
  button.style.cursor = "pointer";

  // Button click handler — opens modal
  button.addEventListener("click", () => {
    // Create the dark overlay
    const overlay = document.createElement("div");
    overlay.id = "popup-overlay";

    // Create the white modal box
    const modal = document.createElement("div");
    modal.id = "popup-modal";

    // Modal title
    const title = document.createElement("h2");
    title.textContent = "Choose Tryjobs";

    // The form to hold checkboxes
    const form = document.createElement("form");

    // Search box to filter tryjobs
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Filter tryjobs...";
    searchInput.style.marginBottom = "10px";
    searchInput.style.width = "100%";

    const labelList = []; // Track labels for filtering

    // Filter labels when user types
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.toLowerCase();
      labelList.forEach(({ label, test }) => {
        label.style.display = test.toLowerCase().includes(query)
          ? "block"
          : "none";
      });
    });

    // Fetch available tryjob names from backend
    fetch("https://bryans-mac-mini.taila3b14e.ts.net/test-names")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        return response.json();
      })
      .then((data) => {
        data.forEach((test) => {
          // Create checkbox for each test
          const label = document.createElement("label");
          label.style.display = "block";
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.name = test;
          checkbox.class = "testBoxes";
          label.appendChild(checkbox);
          label.append(` ${test}`);
          form.appendChild(label);
          labelList.push({ label, test });
        });
      })
      .catch((error) => console.error("Fetch error:", error));

    // Cancel button
    const cancelBtn = document.createElement("button");
    cancelBtn.id = "cancel-popup";
    cancelBtn.textContent = "Cancel";
    cancelBtn.type = "button";
    cancelBtn.addEventListener("click", () => {
      overlay.remove(); // Close the modal
    });

    // Submit button
    const submitBtn = document.createElement("button");
    submitBtn.id = "submit-popup";
    submitBtn.textContent = "Submit";
    submitBtn.type = "button";
    submitBtn.addEventListener("click", () => {
      // Extract test selections
      const selected = Array.from(
        form.querySelectorAll('input[type="checkbox"]:checked')
      ).map((cb) => cb.name);

      // Hardcoded PR number, commit ID, and branch (this should be dynamic ideally)
      const urlParts = window.location.pathname.split("/");
      const prNumber = "37";
      const commitID = "548f60778f536aa8f5076558983df4e92545a396";
      const branch = "Sailloft";

      //TODO: make tests accessible outside function, count FAILURE/PENDING/SUCCESSES
      //      track in a counter and through subscribe status, increment counter till greater
      const test_counts = {};
      let total_tests = 0;
      
      async function fetchTestData() {
      const response = await fetch(
        `https://bryans-mac-mini.taila3b14e.ts.net/run-status?commitID=${commitID}&prNumber=${prNumber}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      if (!response.ok) {
        throw new Error('HTTP error - status ')
      }
      const data = await response.json();
      return data;
      };

      tests = fetchTestData();

      console.log(tests);
      console.log(test_counts);

      console.log("▶️ Triggering run:", {
        commitID,
        prNumber,
        branch,
        selected,
      });


      const detailed_area = document.createElement("div");
      let counter = 0
        for (const test of tests) {
          const item = document.createElement("div");
          item.style.cursor = "pointer"
          item.className = "oval-div"
          if (counter > 1) {
            item.textContent = `+ ${tests.length - counter} more ↗`;
            detailed_area.append(item);
            // Should redirect to more detailed page on the sailloft ip
            // item.addEventListener('click', () => {
            //   window.open('https://example.com', '_blank');
            // })
            break;
          }
          item.textContent = `${test.name} ↗`;
          if (test.status == "PENDING") {
            item.classList.add("pending-div");
          }
          else if (test.status == "SUCCESS") {
            item.classList.add("success-div");
          }
          else if (test.status == "FAILURE") {
            item.classList.add("failure-div");
          }
          detailed_area.append(item);
          counter += 1
        }

      // Spinner while tests are running
      const spinner = document.createElement("div");
      spinner.textContent = "⏳ Running tests...";
      spinner.style.position = "fixed";
      spinner.style.bottom = "20px";
      spinner.style.right = "20px";
      spinner.style.background = "#24292f";
      spinner.style.color = "white";
      spinner.style.padding = "12px 20px";
      spinner.style.borderRadius = "8px";
      spinner.style.zIndex = 10000;
      document.body.appendChild(spinner);

      // Trigger backend to run tests
      fetch("https://bryans-mac-mini.taila3b14e.ts.net/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commitID, branch, prNumber, tests: selected }),
      })
        .then(() => {
          // UI for tracking test status
          const statusText = document.createElement("p");
          let completed = 0;
          const total = selected.length;
          statusText.textContent = `🟡 Subscribed... 0/${total} complete`;
          statusText.style.marginTop = "15px";
          modal.appendChild(statusText);

          const updateList = document.createElement("ul");
          modal.appendChild(updateList);

          const eventSource = new EventSource(
            `https://bryans-mac-mini.taila3b14e.ts.net/subscribe_status_update?commitID=${commitID}&prNumber=${prNumber}`
          );


          eventSource.onmessage = (event) => {
            console.log(selected);
            const update = JSON.parse(event.data);
            const testStatus = update.Records[0].dynamodb.NewImage.Status.S;
            const testName = update.Records[0].dynamodb.NewImage.runId.S;
            console.log(tests.PromiseResu);
            console.log(testStatus);
            console.log(testName);

            const color =
              testStatus === "SUCCESS"
                ? "green"
                : testStatus === "FAILURE"
                ? "red"
                : "grey";

            completed++;
            let li = document.getElementById(testName);
            const content = `✔ ${testName} → <span style="color: ${color}">${testStatus}</span>`;

            if (li) {
              li.innerHTML = content;
            } else {
              li = document.createElement("li");
              li.id = testName;
              li.innerHTML = content;
              updateList.appendChild(li);
            }


            // ✅ All selected tests have reported in
            if (completed >= tests.length) {
              statusText.textContent = `✅ All ${tests.length} tests complete`;
              spinner.remove();
            }
          };

          // ❌ Handle errors
          eventSource.onerror = (err) => {
            console.error("SSE error:", err);
            statusText.textContent = "❌ Subscription failed";
            spinner.style.backgroundColor = "#cb2431";
            setTimeout(() => spinner.remove(), 3000);
            eventSource.close();
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
        .catch((error) => {
          // If /run fails
          console.error("Error triggering run:", error);
          spinner.textContent = "❌ Error triggering tests!";
          spinner.style.backgroundColor = "#cb2431";
          setTimeout(() => spinner.remove(), 3000);
        });
    });

    // Layout row for submit and cancel buttons
    const buttonRow = document.createElement("div");
    buttonRow.style.display = "flex";
    buttonRow.style.justifyContent = "space-between";
    buttonRow.style.marginTop = "20px";
    buttonRow.appendChild(submitBtn);
    buttonRow.appendChild(cancelBtn);

    // Add all UI components to modal
    modal.appendChild(title);
    modal.appendChild(document.createElement("hr"));
    modal.appendChild(searchInput);
    modal.appendChild(form);
    modal.appendChild(document.createElement("hr"));
    modal.appendChild(buttonRow);

    // Attach modal to overlay and overlay to document
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  });

  // Add Tryjobs button to footer
  footer.appendChild(button);

  // Inject styling for modal and buttons
// ...existing code...
  // Inject styling for modal and buttons
  const style = document.createElement("style");
  style.textContent = `
    #popup-overlay {
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      background-color: rgba(0, 0, 0, 0.35);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      font-family: 'Segoe UI', Arial, sans-serif;
    }
    #popup-modal {
      background-color: #fff;
      padding: 32px 28px 24px 28px;
      border-radius: 14px;
      width: 370px;
      max-width: 95vw;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 1.5px 6px rgba(0,0,0,0.10);
      color: #24292f;
      position: relative;
      animation: popup-fadein 0.18s;
    }
    @keyframes popup-fadein {
      from { transform: scale(0.97) translateY(20px); opacity: 0; }
      to   { transform: scale(1) translateY(0); opacity: 1; }
    }
    #popup-modal h2 {
      margin-top: 0;
      margin-bottom: 12px;
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: 0.01em;
    }
    #popup-modal hr {
      margin: 16px 0 18px 0;
      border: none;
      border-top: 1px solid #e1e4e8;
    }
    #popup-modal input[type="text"] {
      padding: 8px 12px 8px 32px;
      border: 1px solid #d1d5da;
      border-radius: 6px;
      font-size: 1rem;
      margin-bottom: 12px;
      background: #f6f8fa url('data:image/svg+xml;utf8,<svg fill="gray" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M11.742 10.344a6.471 6.471 0 001.397-4.1A6.5 6.5 0 105.5 12c1.61 0 3.09-.59 4.1-1.397l3.85 3.85a1 1 0 001.415-1.415l-3.85-3.85zM7.5 12a4.5 4.5 0 110-9 4.5 4.5 0 010 9z"></path></svg>') no-repeat 8px center;
      box-sizing: border-box;
      outline: none;
      transition: border 0.2s;
    }
    #popup-modal input[type="text"]:focus {
      border: 1.5px solid #3272c1;
      background-color: #fff;
    }
    #popup-modal form {
      max-height: 180px;
      overflow-y: auto;
      margin-bottom: 8px;
      padding-right: 4px;
    }
    #popup-modal label {
      display: flex;
      align-items: center;
      padding: 6px 0 6px 2px;
      border-radius: 5px;
      transition: background 0.12s;
      cursor: pointer;
      font-size: 1rem;
    }
    #popup-modal label:hover {
      background: #f0f6fb;
    }
    #popup-modal input[type="checkbox"] {
      accent-color: #3272c1;
      margin-right: 10px;
      width: 16px;
      height: 16px;
    }
    #popup-modal .testBoxes {
      margin-right: 10px;
    }
    #popup-modal .oval-div {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 0.95em;
      margin: 2px 4px 2px 0;
      background: #f6f8fa;
      border: 1px solid #e1e4e8;
      cursor: pointer;
      transition: background 0.15s;
    }
    #popup-modal .oval-div:hover {
      background: #eaf5ff;
    }
    #popup-modal .pending-div {
      background: #fffbe6;
      border-color: #ffe066;
      color: #b38600;
    }
    #popup-modal .success-div {
      background: #e6ffed;
      border-color: #34d058;
      color: #22863a;
    }
    #popup-modal .failure-div {
      background: #ffeef0;
      border-color: #f97583;
      color: #cb2431;
    }
    #popup-modal ul {
      padding-left: 18px;
      margin: 10px 0 0 0;
      max-height: 110px;
      overflow-y: auto;
    }
    #popup-modal ul li {
      margin-bottom: 6px;
      font-size: 1em;
      line-height: 1.4;
    }
    #popup-modal ul li span {
      display: inline-block;
      min-width: 68px;
      font-weight: 600;
      border-radius: 8px;
      padding: 2px 8px;
      margin-left: 8px;
    }
    #popup-modal ul li span[style*="green"] {
      background: #e6ffed;
      color: #22863a;
    }
    #popup-modal ul li span[style*="red"] {
      background: #ffeef0;
      color: #cb2431;
    }
    #popup-modal ul li span[style*="grey"] {
      background: #f6f8fa;
      color: #6a737d;
    }
    #popup-modal .button-row {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 22px;
    }
    #submit-popup, #cancel-popup {
      padding: 7px 18px;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.18s, color 0.18s;
      box-shadow: 0 1px 2px rgba(50,114,193,0.04);
    }
    #submit-popup {
      background-color: #3272c1;
      color: #fff;
    }
    #submit-popup:hover {
      background-color: #255794;
    }
    #cancel-popup {
      background-color: #f6f8fa;
      color: #24292f;
      border: 1px solid #e1e4e8;
    }
    #cancel-popup:hover {
      background-color: #e1e4e8;
    }
    @media (max-width: 500px) {
      #popup-modal {
        width: 98vw;
        padding: 16px 4vw 12px 4vw;
      }
    }
  `;
  document.head.appendChild(style);
// ...existing code...
});
