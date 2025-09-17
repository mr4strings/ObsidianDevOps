# Obsidian DevOps Work Items

This Obsidian plugin converts a custom markup into clickable links that open the corresponding Azure DevOps work item in your browser.

## Features

- Detects a configurable markup (default: `ADO#{{id}}`).
- Generates links that open Azure DevOps work items in a new browser tab.
- Supports case-insensitive matching and customizable link templates.

## Usage

1. Install the plugin into your vault and enable it from **Settings → Community Plugins**.
2. Configure the **Markup template** and **Work item URL** in the plugin settings. Both fields accept the `{{id}}` placeholder, which will be replaced with the numeric work item identifier.
   - Example markup template: `ADO#{{id}}`
   - Example URL template: `https://dev.azure.com/contoso/website/_workitems/edit/{{id}}`
3. Type the configured markup inside your notes (e.g., `ADO#12345`). When the note is rendered, the markup becomes a link to the configured work item URL.

## Development

```bash
npm install
npm run build
```

The build output is written to `main.js`, which Obsidian loads when the plugin runs. Use `npm run dev` for a watch mode build during development.
