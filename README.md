# sslv-price-per-m2

## Description
Injects €/m² column into SS.lv flat listing views where they have hidden it

## Requirements
- Browser with Violentmonkey, Tampermonkey, Greasemonkey, or equivalent UserScript manager.
- Access to SS.lv flats listings (URLs matching `https://www.ss.lv/lv/real-estate/flats/*`).

## Installation
1. Create a new UserScript in Violentmonkey or equivalent.
2. Copy the script source into the editor.
3. Save and enable the script.
4. Navigate to any SS.lv flats listing directory (no `.html` in URL) or a page sorted by €/m².

## Usage
1. Open `https://www.ss.lv/lv/real-estate/flats/` or any subdirectory.
2. Script auto-redirects to `<directory>/fDgSeF4bRDwT.html`.
3. If “Cena, m2” header is missing, the script inserts it before the price column.
4. New column displays calculated €/m² for each listing.
5. Click “Cena, m2” header to toggle between ascending (`fDgSeF4bRDwT`) and descending (`fDgSeF4bRDwS`) sort-keys.

## Configuration
- **ASC_KEY** (`fDgSeF4bRDwT`): Sort-key token for ascending €/m².
- **DESC_KEY** (`fDgSeF4bRDwS`): Sort-key token for descending €/m².
- Modify keys at top of script if SS.lv changes sort-key tokens.

## Update
- Increment version number in `@version` metadata.
- Commit changes to GitHub.
- Update raw URL in UserScript manager if installing via raw link.

## License
MIT License. See [LICENSE](LICENSE) for details.
