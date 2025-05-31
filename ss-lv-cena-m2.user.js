// ==UserScript==
// @name         SS.lv Ensure “Cena, m2” Column + Toggle Sort
// @namespace    https://violentmonkey.github.io/
// @version      1.1
// @description  Redirect any SS.lv flats page without “.html” to the proper sort‐key URL, insert a “Cena, m2” (€/m²) header if missing, compute and inject each row’s €/m² value, and make the header link toggle between ascending/descending €/m² sort‐keys.
// @match        https://www.ss.lv/*/real-estate/flats/*
// @match        https://www.ss.com/*/real-estate/flats/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // –––––––––––––––––––––––––––––––
    // 1) Sort‐key tokens for “Cena, m2”:
    const ASC_KEY  = "fDgSeF4bRDwT";  // ascending €/m²
    const DESC_KEY = "fDgSeF4bRDwS";  // descending €/m²

    const pathname = window.location.pathname;

    // If the URL does NOT end with “.html”, redirect immediately to “…/<ASC_KEY>.html”
    if (!/\.html$/.test(pathname)) {
        // Remove any trailing “/” then append “/fDgSeF4bRDwT.html”
        const withoutSlash = pathname.replace(/\/$/, "");
        const targetURL = withoutSlash + "/" + ASC_KEY + ".html" + window.location.search;
        window.location.replace(targetURL);
        return;
    }

    // –––––––––––––––––––––––––––––––
    // 2) Once on a “.html” URL, wait for the DOM to load, then ensure the header + inject €/m² cells
    window.addEventListener("DOMContentLoaded", () => {
        const currentPath = window.location.pathname;

        // a) Determine the directory portion (everything before the final “/…​.html”)
        const dir = currentPath.replace(/\/[^\/]+\.html$/, "");

        // b) Figure out which sort‐key is currently active so we can toggle
        let targetKey;
        const match = currentPath.match(/\/(fDgSeF4bRDw[TS])\.html$/);
        if (match && match[1] === ASC_KEY) {
            targetKey = DESC_KEY;
        } else if (match && match[1] === DESC_KEY) {
            targetKey = ASC_KEY;
        } else {
            // If neither key is present, default to ascending
            targetKey = ASC_KEY;
        }

        // The href we’ll use for the “Cena, m2” header link:
        const headerHref = dir + "/" + targetKey + ".html";

        // –––––––––––––––––––––––––––––––
        // 2.1) Insert or update the “Cena, m2” header cell in the <tr id="head_line">
        const headRow = document.getElementById("head_line");
        if (headRow) {
            // Look for any existing anchor whose text contains “Cena” AND “m2”
            let existingHeaderLink = null;
            headRow.querySelectorAll("a").forEach(a => {
                const txt = a.textContent.trim();
                if (txt.includes("Cena") && txt.includes("m2")) {
                    existingHeaderLink = a;
                }
            });

            if (existingHeaderLink) {
                // If it already exists, just update its href
                existingHeaderLink.setAttribute("href", headerHref);
            } else {
                // Otherwise, insert a new <td> before the last “price” <td>
                const allHeaderCells = Array.from(headRow.querySelectorAll("td"));
                if (allHeaderCells.length > 0) {
                    // Identify the “price” header cell (last <td> in the row)
                    const priceHeaderCell = allHeaderCells[ allHeaderCells.length - 1 ];

                    // Build a new <td> for “Cena, m2” matching SS.lv’s styling:
                    const newTh = document.createElement("td");
                    newTh.setAttribute("style", "border-left:1px #FFFFFF solid;");
                    newTh.setAttribute("class", "msg_column");
                    newTh.setAttribute("nowrap", "");
                    newTh.setAttribute("background", "https://i.ss.lv/img/pl.gif");

                    // Wrap in <noindex><a …> so it matches how SS.lv does it
                    newTh.innerHTML = `
                        <noindex>
                          <a rel="nofollow" href="${headerHref}" class="a18">Cena, m2</a>
                        </noindex>
                    `.trim();

                    headRow.insertBefore(newTh, priceHeaderCell);
                }
            }
        }

        // –––––––––––––––––––––––––––––––
        // 2.2) For each listing row, compute and inject the €/m² value if missing
        const rows = document.querySelectorAll('tr[id^="tr_"]');
        rows.forEach(row => {
            const tds = Array.from(row.querySelectorAll("td"));

            // We only want data rows that currently lack a €/m² cell.
            // In a “missing column” scenario, there are exactly 9 <td> elements:
            // [0]=checkbox, [1]=image, [2]=description, [3]=area, [4]=rooms, [5]=m2, [6]=floor, [7]=series, [8]=price
            if (tds.length === 9) {
                const m2Cell    = tds[5];
                const priceCell = tds[8];

                if (!m2Cell || !priceCell) return;

                const m2Text    = m2Cell.textContent.trim();
                const priceText = priceCell.textContent.trim();

                // Parse only digits from “m2” and “price”
                const m2Value    = parseInt(m2Text.replace(/\D/g, ""), 10);
                const priceValue = parseInt(priceText.replace(/\D/g, ""), 10);

                if (isNaN(m2Value) || m2Value <= 0 || isNaN(priceValue) || priceValue <= 0) {
                    return; // skip rows where parsing fails
                }

                // Compute €/m², rounding to nearest integer
                const perM2 = Math.round(priceValue / m2Value);

                // Format with commas (e.g. “1,835”) as SS.lv does
                const formatted = perM2.toLocaleString("en-US");

                // Grab the listing’s href from the existing price‐cell anchor (so clicking the new value opens the same listing)
                const listingAnchor = priceCell.querySelector("a");
                const listingHref   = listingAnchor ? listingAnchor.getAttribute("href") : null;

                // Create a new <td> with the same classes/attributes as other data cells
                const newTd = document.createElement("td");
                // Match SS.lv’s classes for data cells:
                newTd.setAttribute("class", m2Cell.getAttribute("class") || "msga2-o pp6");
                newTd.setAttribute("nowrap", "");
                newTd.setAttribute("c", "1");

                if (listingHref) {
                    // Wrap in an <a onclick="return false;" …> just like SS.lv’s other columns
                    newTd.innerHTML = `
                        <a onclick="return false;" href="${listingHref}" class="amopt">
                          <b>${formatted} €</b>
                        </a>
                    `.trim();
                } else {
                    newTd.textContent = `${formatted} €`;
                }

                // Insert the new €/m² cell right before the existing “price” cell (tds[8])
                row.insertBefore(newTd, priceCell);
            }

            // If tds.length is already 10 (i.e. column exists), we skip
        });
    });
})();
