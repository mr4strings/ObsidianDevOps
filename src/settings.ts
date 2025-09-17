import { App, PluginSettingTab, Setting } from "obsidian";
import type DevOpsLinkPlugin from "./main";

export interface DevOpsLinkSettings {
  /**
   * Template describing the markup to transform. Use {{id}} as the placeholder
   * for the work item identifier (numbers only).
   */
  markupTemplate: string;
  /**
   * Template used to generate the final link. Use {{id}} as the placeholder for
   * the work item identifier. When omitted the identifier will be appended to
   * the end of the template.
   */
  workItemUrlTemplate: string;
  /**
   * When true the markup matcher is case insensitive.
   */
  ignoreCase: boolean;
}

export const DEFAULT_SETTINGS: DevOpsLinkSettings = {
  markupTemplate: "ADO#{{id}}",
  workItemUrlTemplate:
    "https://dev.azure.com/your-organization/your-project/_workitems/edit/{{id}}",
  ignoreCase: true
};

export class DevOpsLinkSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: DevOpsLinkPlugin) {
    super(app, plugin);
  }

  public display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", {
      text: "Azure DevOps work item links"
    });

    new Setting(containerEl)
      .setName("Markup template")
      .setDesc(
        "Text pattern that marks a work item. Include {{id}} where the numeric identifier should appear."
      )
      .addText((text) =>
        text
          .setPlaceholder("ADO#{{id}}")
          .setValue(this.plugin.settings.markupTemplate)
          .onChange(async (value) => {
            this.plugin.settings.markupTemplate = value;
            this.plugin.updateMarkupRegex();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Work item URL")
      .setDesc(
        "Link that will be opened. Include {{id}} where the work item identifier should be inserted. If the placeholder is missing the identifier is appended to the end of the URL."
      )
      .addText((text) =>
        text
          .setPlaceholder(
            "https://dev.azure.com/your-organization/your-project/_workitems/edit/{{id}}"
          )
          .setValue(this.plugin.settings.workItemUrlTemplate)
          .onChange(async (value) => {
            this.plugin.settings.workItemUrlTemplate = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Ignore case")
      .setDesc("Match markup regardless of letter casing.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.ignoreCase)
          .onChange(async (value) => {
            this.plugin.settings.ignoreCase = value;
            this.plugin.updateMarkupRegex();
            await this.plugin.saveSettings();
          })
      );
  }
}
