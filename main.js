/* ObsidianDevOps plugin, created by OpenAI Assistant */
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => DevOpsLinkPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian2 = require("obsidian");

// src/settings.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  markupTemplate: "ADO#{{id}}",
  workItemUrlTemplate: "https://dev.azure.com/your-organization/your-project/_workitems/edit/{{id}}",
  ignoreCase: true
};
var DevOpsLinkSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", {
      text: "Azure DevOps work item links"
    });
    new import_obsidian.Setting(containerEl).setName("Markup template").setDesc(
      "Text pattern that marks a work item. Include {{id}} where the numeric identifier should appear."
    ).addText(
      (text) => text.setPlaceholder("ADO#{{id}}").setValue(this.plugin.settings.markupTemplate).onChange(async (value) => {
        this.plugin.settings.markupTemplate = value;
        this.plugin.updateMarkupRegex();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Work item URL").setDesc(
      "Link that will be opened. Include {{id}} where the work item identifier should be inserted. If the placeholder is missing the identifier is appended to the end of the URL."
    ).addText(
      (text) => text.setPlaceholder(
        "https://dev.azure.com/your-organization/your-project/_workitems/edit/{{id}}"
      ).setValue(this.plugin.settings.workItemUrlTemplate).onChange(async (value) => {
        this.plugin.settings.workItemUrlTemplate = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Ignore case").setDesc("Match markup regardless of letter casing.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.ignoreCase).onChange(async (value) => {
        this.plugin.settings.ignoreCase = value;
        this.plugin.updateMarkupRegex();
        await this.plugin.saveSettings();
      })
    );
  }
};

// src/main.ts
var DevOpsLinkPlugin = class extends import_obsidian2.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.markupRegex = null;
  }
  async onload() {
    await this.loadSettings();
    this.updateMarkupRegex();
    this.addSettingTab(new DevOpsLinkSettingTab(this.app, this));
    this.registerMarkdownPostProcessor((element) => {
      this.processRenderedMarkdown(element);
    });
  }
  async loadSettings() {
    const stored = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, stored);
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  updateMarkupRegex() {
    this.markupRegex = this.createMarkupRegex(this.settings.markupTemplate);
  }
  processRenderedMarkdown(element) {
    const baseRegex = this.markupRegex;
    if (!baseRegex) {
      return;
    }
    const textNodes = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    while (current) {
      if (current.nodeType === Node.TEXT_NODE) {
        textNodes.push(current);
      }
      current = walker.nextNode();
    }
    for (const textNode of textNodes) {
      if (this.shouldSkipNode(textNode)) {
        continue;
      }
      this.transformTextNode(textNode, baseRegex);
    }
  }
  shouldSkipNode(node) {
    const parentElement = node.parentElement;
    if (!parentElement) {
      return false;
    }
    return Boolean(parentElement.closest("code, pre, a, style, script"));
  }
  transformTextNode(node, baseRegex) {
    var _a, _b, _c, _d;
    const text = node.nodeValue;
    if (!text) {
      return;
    }
    const regex = new RegExp(baseRegex.source, baseRegex.flags);
    const matches = [...text.matchAll(regex)];
    if (matches.length === 0) {
      return;
    }
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    for (const match of matches) {
      const matchIndex = (_a = match.index) != null ? _a : 0;
      if (matchIndex > lastIndex) {
        fragment.append(text.slice(lastIndex, matchIndex));
      }
      const matchText = match[0];
      const workItemId = ((_d = (_c = (_b = match.groups) == null ? void 0 : _b.id) != null ? _c : match[1]) != null ? _d : "").trim();
      const workItemUrl = workItemId ? this.buildWorkItemUrl(workItemId) : null;
      if (workItemUrl) {
        fragment.append(
          this.createLinkElement(matchText, workItemUrl, workItemId)
        );
      } else {
        fragment.append(matchText);
      }
      lastIndex = matchIndex + matchText.length;
    }
    if (lastIndex < text.length) {
      fragment.append(text.slice(lastIndex));
    }
    node.replaceWith(fragment);
  }
  buildWorkItemUrl(workItemId) {
    const template = this.settings.workItemUrlTemplate.trim();
    if (!template) {
      return null;
    }
    if (template.includes("{{id}}")) {
      return template.replace(/{{id}}/g, encodeURIComponent(workItemId));
    }
    return `${template}${encodeURIComponent(workItemId)}`;
  }
  createLinkElement(text, href, workItemId) {
    const anchor = document.createElement("a");
    anchor.classList.add("devops-work-item-link");
    anchor.href = href;
    anchor.rel = "noopener noreferrer";
    anchor.target = "_blank";
    anchor.textContent = text;
    anchor.title = `Open work item ${workItemId} in Azure DevOps`;
    anchor.ariaLabel = `Open work item ${workItemId} in Azure DevOps`;
    return anchor;
  }
  createMarkupRegex(template) {
    var _a;
    const trimmed = template.trim();
    if (!trimmed) {
      return null;
    }
    const placeholderMatches = (_a = trimmed.match(/{{id}}/g)) != null ? _a : [];
    if (placeholderMatches.length !== 1) {
      console.warn(
        "[ObsidianDevOps] markup template must contain exactly one {{id}} placeholder."
      );
      return null;
    }
    const escaped = escapeRegExp(trimmed);
    const pattern = escaped.replace(
      /\\\{\\\{id\\\}\\\}/g,
      "(?<id>\\d+)"
    );
    const flags = `g${this.settings.ignoreCase ? "i" : ""}`;
    try {
      return new RegExp(pattern, flags);
    } catch (error) {
      console.error("[ObsidianDevOps] failed to create markup regex", error);
      return null;
    }
  }
};
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
