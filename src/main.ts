import { Plugin } from "obsidian";
import {
  DEFAULT_SETTINGS,
  DevOpsLinkSettings,
  DevOpsLinkSettingTab
} from "./settings";

export default class DevOpsLinkPlugin extends Plugin {
  public settings: DevOpsLinkSettings = DEFAULT_SETTINGS;
  private markupRegex: RegExp | null = null;

  public async onload(): Promise<void> {
    await this.loadSettings();
    this.updateMarkupRegex();
    this.addSettingTab(new DevOpsLinkSettingTab(this.app, this));

    this.registerMarkdownPostProcessor((element) => {
      this.processRenderedMarkdown(element);
    });
  }

  public async loadSettings(): Promise<void> {
    const stored = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, stored);
  }

  public async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  public updateMarkupRegex(): void {
    this.markupRegex = this.createMarkupRegex(this.settings.markupTemplate);
  }

  private processRenderedMarkdown(element: HTMLElement): void {
    const baseRegex = this.markupRegex;
    if (!baseRegex) {
      return;
    }

    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let current: Node | null = walker.nextNode();
    while (current) {
      if (current.nodeType === Node.TEXT_NODE) {
        textNodes.push(current as Text);
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

  private shouldSkipNode(node: Text): boolean {
    const parentElement = node.parentElement;
    if (!parentElement) {
      return false;
    }

    return Boolean(parentElement.closest("code, pre, a, style, script"));
  }

  private transformTextNode(node: Text, baseRegex: RegExp): void {
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
      const matchIndex = match.index ?? 0;
      if (matchIndex > lastIndex) {
        fragment.append(text.slice(lastIndex, matchIndex));
      }

      const matchText = match[0];
      const workItemId = (match.groups?.id ?? match[1] ?? "").trim();
      const workItemUrl = workItemId
        ? this.buildWorkItemUrl(workItemId)
        : null;

      if (workItemUrl) {
        const idIndex = matchText.indexOf(workItemId);

        if (idIndex === -1) {
          fragment.append(
            this.createLinkElement(matchText, workItemUrl, workItemId)
          );
        } else {
          const prefixText = matchText.slice(0, idIndex);
          const suffixText = matchText.slice(idIndex + workItemId.length);

          if (prefixText) {
            fragment.append(prefixText);
          }

          fragment.append(
            this.createLinkElement(workItemId, workItemUrl, workItemId)
          );

          if (suffixText) {
            fragment.append(suffixText);
          }
        }
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

  private buildWorkItemUrl(workItemId: string): string | null {
    const template = this.settings.workItemUrlTemplate.trim();
    if (!template) {
      return null;
    }

    if (template.includes("{{id}}")) {
      return template.replace(/{{id}}/g, encodeURIComponent(workItemId));
    }

    return `${template}${encodeURIComponent(workItemId)}`;
  }

  private createLinkElement(
    text: string,
    href: string,
    workItemId: string
  ): HTMLAnchorElement {
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

  private createMarkupRegex(template: string): RegExp | null {
    const trimmed = template.trim();
    if (!trimmed) {
      return null;
    }

    const placeholderMatches = trimmed.match(/{{id}}/g) ?? [];
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
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
